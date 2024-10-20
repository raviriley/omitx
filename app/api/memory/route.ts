import { NextRequest } from "next/server";
import OpenAI from "openai";
import { SupabaseProvider } from "@/providers/supabase.provider";
import { Wallet, Coinbase } from "@/providers/coinbase.provider";
import { TransferStatus, WalletData } from "@coinbase/coinbase-sdk";

const client = new OpenAI({
  baseURL: "https://api.red-pill.ai/v1",
  apiKey: process.env["OPENAI_API_KEY"],
});

const supabase = SupabaseProvider.supabase;

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
    if (!uid) {
      throw new Error("User ID (uid) is required.");
    }
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

    if (transaction_messages.length === 0) {
      return new Response(null, { status: 204 });
    }

    const { data: allUsers, error: allUsersError } = await supabase
      .from("user")
      .select("username");

    if (allUsersError) {
      throw new Error(`User fetch error: ${allUsersError.message}`);
    }

    const usernamesList = allUsers.map((user) => user.username).join(", ");

    // Fetch wallet data from Supabase
    const { data: walletData, error: walletError } = await supabase
      .from("user")
      .select("wallet")
      .eq("omi_id", uid)
      .single();

    if (walletError) {
      throw new Error(`Wallet fetch error: ${walletError.message}`);
    }

    // Instantiate the wallet using the Coinbase provider
    const fromWallet = await Wallet.import(walletData?.wallet as WalletData);

    // Process each transaction message using OpenAI
    const processed_messages = await Promise.all(
      transaction_messages.map(async (message) => {
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
                The user will provide you with a text transcription of a spoken request to create a blockchain transaction. 
                Extract the recipient, amount, and currency from the transaction message. 
                Output a structured JSON object with 'to' for the recipient username, 'amount' for the amount, and 'currency' for the currency. 
                Use 'USDC' for dollar amounts, otherwise use ETH.
                Here are the available usernames: ${usernamesList}.
              `,
            },
            { role: "user", content: message },
          ],
          response_format: { type: "json_object" },
        });

        const extractedInfo = response.choices[0].message.content;
        if (!extractedInfo) {
          throw new Error("No transactions detected.");
        }

        return { ...JSON.parse(extractedInfo), transcript: message };
      }),
    );

    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("username")
      .eq("omi_id", uid)
      .single();

    if (userError) {
      throw new Error(`User fetch error: ${userError.message}`);
    }

    const fromUsername = userData?.username || null;

    for (const msg of processed_messages) {
      const { data: toWalletData, error: toWalletError } = await supabase
        .from("user")
        .select("wallet")
        .eq("username", msg.to)
        .single();

      if (toWalletError) {
        throw new Error(`To wallet fetch error: ${toWalletError.message}`);
      }

      const toWallet = await (
        await Wallet.import(toWalletData?.wallet as WalletData)
      ).getDefaultAddress();

      const transaction = await (
        await fromWallet
      ).createTransfer({
        amount: msg.amount,
        assetId:
          msg.currency === "USDC" ? Coinbase.assets.Usdc : Coinbase.assets.Eth,
        destination: toWallet,
        gasless: msg.currency === "USDC",
      });

      const transactionReceipt = await transaction.wait();
      if (transactionReceipt.getStatus() !== TransferStatus.COMPLETE) {
        throw new Error("Transaction failed.");
      } else {
        await supabase.from("transaction").insert({
          amount: msg.amount,
          currrency: msg.currency,
          device_uid: uid,
          from: fromUsername,
          to: msg.to,
          transcript: msg.transcript,
          txid: transactionReceipt.getId(),
        });
      }
    }
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
