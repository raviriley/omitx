import { NextRequest } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
});

const START_TRIGGER_PHRASES = ["start transaction", "start transaction."];
const END_TRIGGER_PHRASES = ["end transaction", "end transaction."];

function extractTxMessages(
  text: string,
  startPhrases: string[],
  endPhrases: string[],
): string[] {
  const startPattern = startPhrases.join("|");
  const endPattern = endPhrases.join("|");
  const matchRegex = new RegExp(`(${startPattern})(.*?)(${endPattern})`, "g");
  const matches = [];
  let match;
  while ((match = matchRegex.exec(text)) !== null) {
    // Capture the text between start and end phrases
    // Extract the matched text and trim any leading/trailing whitespace
    let message = match[2].trim();
    // Remove leading period if present
    if (message.startsWith(".")) {
      message = message.substring(1).trim();
    }
    // Capitalize the first letter of the message and the first letter after each sentence-ending punctuation
    message = message.replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    console.log(message);
    matches.push(message);
  }

  return matches;
}

export async function POST(request: NextRequest) {
  try {
    const reqUrl = request.url;
    const { searchParams } = new URL(reqUrl);
    const uid = searchParams.get("uid");
    const text = await request.text();
    const data = JSON.parse(text);

    // Combine all transcript segments into a single string
    const transcript = data.transcript_segments
      .map((segment: { text: string }) => segment.text)
      .join(" ");

    const transaction_messages = extractTxMessages(
      transcript.toLowerCase(),
      START_TRIGGER_PHRASES,
      END_TRIGGER_PHRASES,
    );

    // process each transaction message using openai
    const processed_messages = await Promise.all(
      transaction_messages.map(async (message) => {
        const response = await client.chat.completions.create({
          model: "gpt-4-0613",
          messages: [
            {
              role: "system",
              content:
                "Extract the recipient and currency from the transaction message. Output a JSON object with 'to' for the recipient and 'currency' for the currency. Use 'USDC' for dollar amounts.",
            },
            { role: "user", content: message },
          ],
          functions: [
            {
              name: "extract_transaction_info",
              description:
                "Extracts recipient and currency information from a transaction message",
              parameters: {
                type: "object",
                properties: {
                  to: {
                    type: "string",
                    description: "The recipient of the transaction",
                  },
                  currency: {
                    type: "string",
                    description:
                      "The currency of the transaction ('USDC' or 'ETH')",
                  },
                },
                required: ["to", "currency"],
              },
            },
          ],
          function_call: { name: "extract_transaction_info" },
        });

        const extractedInfo = JSON.parse(
          response.choices[0].message.function_call.arguments,
        );
        return extractedInfo;
      }),
    );

    // add to db
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      `Webhook error: ${error instanceof Error ? error.message : `Unknown error: ${error}`}`,
      {
        status: 400,
      },
    );
  }

  return new Response("Success!", {
    status: 200,
  });
}

export async function GET(request: Request) {
  console.error(request.text());
  return new Response("Worked", { status: 200 });
}
