import { NextRequest } from "next/server";
import OpenAI from "openai";
import { SupabaseProvider } from "@/providers/supabase.provider";
import { Wallet, Coinbase } from "@/providers/coinbase.provider";
import {
  TransactionStatus,
  TransferStatus,
  WalletData,
} from "@coinbase/coinbase-sdk";
import { revalidatePath } from "next/cache";

// Initialize OpenAI client with Red Pill's base URL and API key
const client = new OpenAI({
  baseURL: "https://api.red-pill.ai/v1",
  apiKey: process.env["OPENAI_API_KEY"],
});

// Initialize Supabase client
const supabase = SupabaseProvider.supabase;

// Define trigger phrases for transaction and swap extraction
const START_TRIGGER_PHRASES = [
  "start transaction",
  "start transaction.",
  "start the transaction",
  "start the transaction.",
];
const END_TRIGGER_PHRASES = [
  "end transaction",
  "end transaction.",
  "and transaction",
  "end the transaction",
  "end the transaction.",
  "and the transaction",
  "and the transaction.",
];

const SWAP_START_TRIGGER_PHRASES = ["start swap", "start swap."];
const SWAP_END_TRIGGER_PHRASES = ["end swap", "end swap."];

// Function to extract transaction and swap messages from the transcript
function extractMessages(
  text: string,
  startPhrases: string[],
  endPhrases: string[],
): string[] {
  const startPattern = startPhrases.join("|");
  const endPattern = endPhrases.join("|");
  const matchRegex = new RegExp(`(${startPattern})(.*?)(${endPattern})`, "g");
  const matches = [];
  let match;

  // Loop through matches and format the extracted messages
  while ((match = matchRegex.exec(text)) !== null) {
    let message = match[2].trim();
    if (message.startsWith(".")) {
      message = message.substring(1).trim();
    }
    message = message.replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    matches.push(message);
  }

  return matches;
}

// Main function to handle POST requests
export async function POST(request: NextRequest) {
  try {
    const reqUrl = request.url;
    const { searchParams } = new URL(reqUrl);
    const uid = searchParams.get("uid"); // Extract user ID from query parameters
    if (!uid) {
      throw new Error("User ID (uid) is required."); // Ensure UID is provided
    }
    console.log("Received request for user with OMI UID ", uid);
    const text = await request.text(); // Get the request body as text
    const data = JSON.parse(text); // Parse the JSON data

    // Combine all transcript segments into a single string
    const transcript = data.transcript_segments
      .map((segment: { text: string }) => segment.text)
      .join(" ");

    // Extract transaction and swap messages from the transcript
    const transaction_messages = extractMessages(
      transcript.toLowerCase(),
      START_TRIGGER_PHRASES,
      END_TRIGGER_PHRASES,
    );

    const swap_messages = extractMessages(
      transcript.toLowerCase(),
      SWAP_START_TRIGGER_PHRASES,
      SWAP_END_TRIGGER_PHRASES,
    );

    // If no messages are found, return a 204 No Content response
    if (transaction_messages.length === 0 && swap_messages.length === 0) {
      return new Response(null, { status: 204 });
    }

    // Fetch all usernames from the Supabase database
    const { data: allUsers, error: allUsersError } = await supabase
      .from("user")
      .select("username");

    if (allUsersError) {
      throw new Error(`User fetch error: ${allUsersError.message}`);
    }

    // Fetch the specific user data based on the provided UID
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("username")
      .eq("omi_id", uid)
      .single();

    if (userError) {
      throw new Error(`User fetch error: ${userError.message}`);
    }

    const fromUsername = userData?.username || null; // Get the username of the sender
    const usernamesList = allUsers.map((user) => user.username).join(", "); // Create a list of usernames

    // Process each transaction message using OpenAI
    const processed_messages = await Promise.all(
      transaction_messages.map(async (message) => {
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
                The user will provide you with a text transcription of a spoken request to create a blockchain transaction on a specific network/chain. 
                Extract the recipient, amount, currency, and network from the transaction message.
                Output a structured JSON object with 'to' for the recipient username, 'amount' for the amount, 'currency' for the currency, and 'network' for the network.
                Use 'USDC' for dollar amounts on any network, otherwise use 'ETH' for all other networks.
                Available networks are: base, polygon, arbitrum, ethereum. Enum for 'network' is {base, polygon, arbitrum, eth}
                Here are the available usernames: ${usernamesList}.
              `,
            },
            { role: "user", content: message },
          ],
          response_format: { type: "json_object" },
        });

        const extractedInfo = response.choices[0].message.content; // Extract the structured information from the response
        if (!extractedInfo) {
          throw new Error("No transactions detected."); // Handle case where no transactions are detected
        }

        return { ...JSON.parse(extractedInfo), transcript: message }; // Return the parsed transaction info along with the original message
      }),
    );

    console.log("processed_messages: ", processed_messages);

    // Handle the processed swaps
    const processed_swaps = await Promise.all(
      swap_messages.map(async (message) => {
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
                The user will provide you with a text transcription of a spoken request to swap currencies between ETH and USDC. 
                Output a structured JSON object with 'amount' for the amount, 'fromCurrency' for the currency being swapped from, 'toCurrency' for the currency being swapped to, and 'network' for the network on which the swap is taking place.
                Available networks are: base, polygon, arbitrum, eth. Enum for 'network' is {base, polygon, arbitrum, eth}
              `,
            },
            { role: "user", content: message },
          ],
          response_format: { type: "json_object" },
        });

        const extractedInfo = response.choices[0].message.content; // Extract the structured information from the response
        if (!extractedInfo) {
          throw new Error("No swaps detected."); // Handle case where no swaps are detected
        }

        return { ...JSON.parse(extractedInfo), transcript: message }; // Return the parsed swap info along with the original message
      }),
    );

    console.log("processed_swaps: ", processed_swaps);

    // Process each transaction message
    for (const msg of processed_messages) {
      // check if the msg is a valid transaction
      if (!msg?.amount || !msg?.currency || !msg?.network || !msg?.to) {
        continue;
      }

      // Fetch the recipient's wallet data from Supabase
      const { data: userData, error: userDataError } = await supabase
        .from("user")
        .select("*")
        .eq("username", msg.to)
        .single();

      if (userDataError) {
        throw new Error(`To wallet fetch error: ${userDataError.message}`);
      }

      const chosenNetwork = `${msg.network.toLowerCase()}_wallet`; // Determine the wallet field based on the network
      const toWallet = await (
        await Wallet.import(
          userData[chosenNetwork as keyof typeof userData] as WalletData,
        )
      ).getDefaultAddress(); // Get the default address of the recipient's wallet

      // Fetch sender wallet data from Supabase
      const { data: senderWalletData, error: senderWalletDataError } =
        await supabase.from("user").select("*").eq("omi_id", uid).single();

      if (senderWalletDataError) {
        throw new Error(`Wallet fetch error: ${senderWalletDataError.message}`);
      }

      // Instantiate the sender's wallet using the Coinbase provider
      const fromWallet = await Wallet.import(
        senderWalletData[
          chosenNetwork as keyof typeof senderWalletData
        ] as WalletData,
      );

      console.log(
        `Creating transfer from ${fromUsername} (${(await fromWallet.getDefaultAddress()).getId()}) to ${msg.to} (${toWallet.getId()}) for ${msg.amount} ${msg.currency} on ${msg.network}`,
      );

      // Create the transfer transaction
      const transaction = await fromWallet.createTransfer({
        amount: msg.amount,
        assetId:
          msg.currency === "USDC" ? Coinbase.assets.Usdc : Coinbase.assets.Eth,
        destination: toWallet,
        gasless: msg.currency === "USDC" && msg.network === "base", // Use gasless transfer for USDC on Base
      });

      const transactionReceipt = await transaction.wait(); // Wait for the transaction to complete
      if (transactionReceipt.getStatus() !== TransferStatus.COMPLETE) {
        throw new Error("Transaction failed."); // Handle transaction failure
      } else {
        // Log the transaction in the Supabase database
        console.log("adding tx to database");
        const { error: txError } = await supabase.from("transaction").insert({
          amount: msg.amount,
          currrency: msg.currency,
          device_uid: uid,
          from: fromUsername,
          to: msg.to,
          transcript: msg.transcript,
          txid: transactionReceipt.getTransactionHash(),
          chain: msg.network,
        });
        console.log("txError: ", txError);
      }
    }

    // Handle the processed swaps
    for (const swap of processed_swaps) {
      // check if the swap is valid
      if (
        !swap?.amount ||
        !swap?.fromCurrency ||
        !swap?.toCurrency ||
        !swap?.network ||
        swap?.network !== "base"
      ) {
        continue;
      }

      const fromAssetId =
        swap.fromCurrency === "USDC"
          ? Coinbase.assets.Usdc
          : Coinbase.assets.Eth; // Determine the asset ID for the currency being swapped from
      const toAssetId =
        swap.toCurrency === "USDC" ? Coinbase.assets.Usdc : Coinbase.assets.Eth; // Determine the asset ID for the currency being swapped to

      console.log(
        `Creating trade from ${swap.fromCurrency} to ${swap.toCurrency} for ${swap.amount} on ${swap.network}`,
      );

      // Fetch sender wallet data from Supabase
      const { data: senderWalletData, error: senderWalletDataError } =
        await supabase.from("user").select("*").eq("omi_id", uid).single();

      if (senderWalletDataError) {
        throw new Error(`Wallet fetch error: ${senderWalletDataError.message}`);
      }

      const chosenNetwork = `${swap.network.toLowerCase()}_wallet`; // Determine the wallet field based on the network

      // Instantiate the sender's wallet using the Coinbase provider
      const fromWallet = await Wallet.import(
        senderWalletData[
          chosenNetwork as keyof typeof senderWalletData
        ] as WalletData,
      );

      // Create the trade transaction
      const trade = await fromWallet.createTrade({
        amount: swap.amount,
        fromAssetId: fromAssetId,
        toAssetId: toAssetId,
      });

      const tradeReceipt = await trade.wait(); // Wait for the trade to complete
      if (tradeReceipt.getStatus() !== TransactionStatus.COMPLETE) {
        throw new Error("Trade failed."); // Handle trade failure
      } else {
        // Log the trade in the Supabase database
        const { error: tradeError } = await supabase.from("trade").insert({
          amount_deposit: swap.amount,
          amount_receive: tradeReceipt.getToAmount().toNumber(),
          device_uid: uid,
          from_currency: swap.fromCurrency,
          to_currency: swap.toCurrency,
          transcript: swap.transcript,
          txid: tradeReceipt.getTransaction().getTransactionHash(),
          chain: swap.network,
        });
        console.log("tradeError: ", tradeError);
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      `Webhook error: ${error instanceof Error ? error.message : `Unknown error: ${error}`}`,
      {
        status: 400, // Return a 400 Bad Request response on error
      },
    );
  }

  revalidatePath("/");

  return new Response("Success!", {
    status: 200, // Return a 200 OK response on success
  });
}

// Function to handle GET requests (currently logs the request body)
export async function GET(request: Request) {
  console.error(request.text());
  return new Response("Worked", { status: 200 }); // Return a 200 OK response
}
