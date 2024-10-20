import { NextRequest } from "next/server";
import OpenAI from "openai";
import { SupabaseProvider } from "@/providers/supabase.provider";
import { Wallet, Coinbase } from "@/providers/coinbase.provider";
import {
  TransactionStatus,
  TransferStatus,
  WalletData,
} from "@coinbase/coinbase-sdk";

const client = new OpenAI({
  baseURL: "https://api.red-pill.ai/v1",
  apiKey: process.env["OPENAI_API_KEY"],
});

const supabase = SupabaseProvider.supabase;

const START_TRIGGER_PHRASES = ["start transaction", "start transaction."];
const END_TRIGGER_PHRASES = [
  "end transaction",
  "end transaction.",
  "and transaction",
];

const SWAP_START_TRIGGER_PHRASES = ["start swap", "start swap."];
const SWAP_END_TRIGGER_PHRASES = ["end swap", "end swap."];

// Function to extract transaction messages
function extractTxMessages(
  text: string,
  startPhrases: string[],
  endPhrases: string[]
): string[] {
  const startPattern = startPhrases.join("|");
  const endPattern = endPhrases.join("|");
  const matchRegex = new RegExp(`(${startPattern})(.*?)(${endPattern})`, "g");
  const matches = [];
  let match;
  while ((match = matchRegex.exec(text)) !== null) {
    let message = match[2].trim();
    if (message.startsWith(".")) {
      message = message.substring(1).trim();
    }
    message = message.replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    console.log(message);
    matches.push(message);
  }

  return matches;
}

// Function to extract swap messages
function extractSwapMessages(
  text: string,
  startPhrases: string[],
  endPhrases: string[]
): string[] {
  const startPattern = startPhrases.join("|");
  const endPattern = endPhrases.join("|");
  const matchRegex = new RegExp(`(${startPattern})(.*?)(${endPattern})`, "g");
  const matches = [];
  let match;
  while ((match = matchRegex.exec(text)) !== null) {
    let message = match[2].trim();
    if (message.startsWith(".")) {
      message = message.substring(1).trim();
    }
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
    console.log("Received request for user w uid: ", uid);
    const text = await request.text();
    const data = JSON.parse(text);

    // Combine all transcript segments into a single string
    const transcript = data.transcript_segments
      .map((segment: { text: string }) => segment.text)
      .join(" ");

    const transaction_messages = extractTxMessages(
      transcript.toLowerCase(),
      START_TRIGGER_PHRASES,
      END_TRIGGER_PHRASES
    );

    const swap_messages = extractSwapMessages(
      transcript.toLowerCase(),
      SWAP_START_TRIGGER_PHRASES,
      SWAP_END_TRIGGER_PHRASES
    );

    if (transaction_messages.length === 0 && swap_messages.length === 0) {
      return new Response(null, { status: 204 });
    }

    const { data: allUsers, error: allUsersError } = await supabase
      .from("user")
      .select("username");

    if (allUsersError) {
      throw new Error(`User fetch error: ${allUsersError.message}`);
    }

    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("username")
      .eq("omi_id", uid)
      .single();

    if (userError) {
      throw new Error(`User fetch error: ${userError.message}`);
    }

    const fromUsername = userData?.username || null;

    const usernamesList = allUsers.map((user) => user.username).join(", ");

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

        const extractedInfo = response.choices[0].message.content;
        if (!extractedInfo) {
          throw new Error("No transactions detected.");
        }

        return { ...JSON.parse(extractedInfo), transcript: message };
      })
    );

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

        const extractedInfo = response.choices[0].message.content;
        if (!extractedInfo) {
          throw new Error("No swaps detected.");
        }

        return { ...JSON.parse(extractedInfo), transcript: message };
      })
    );

    for (const msg of processed_messages) {
      const { data: userData, error: userDataError } = await supabase
        .from("user")
        .select("*")
        .eq("username", msg.to)
        .single();

      if (userDataError) {
        throw new Error(`To wallet fetch error: ${userDataError.message}`);
      }

      const chosenNetwork = `${msg.network.toLowerCase()}_wallet`;

      const toWallet = await (
        await Wallet.import(
          userData[chosenNetwork as keyof typeof userData] as WalletData
        )
      ).getDefaultAddress();

      // Fetch sender wallet data from Supabase
      const { data: senderWalletData, error: senderWalletDataError } =
        await supabase.from("user").select("*").eq("omi_id", uid).single();

      if (senderWalletDataError) {
        throw new Error(`Wallet fetch error: ${senderWalletDataError.message}`);
      }

      // Instantiate the wallet using the Coinbase provider
      const fromWallet = await Wallet.import(
        senderWalletData[
          chosenNetwork as keyof typeof senderWalletData
        ] as WalletData
      );

      console.log(
        `Creating transfer from ${fromUsername} (${(await fromWallet.getDefaultAddress()).getId()}) to ${msg.to} (${toWallet.getId()}) for ${msg.amount} ${msg.currency} on ${msg.network}`
      );

      const transaction = await fromWallet.createTransfer({
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
          network: msg.network,
        });
      }
    }

    // Handle the processed swaps
    for (const swap of processed_swaps) {
      const fromAssetId =
        swap.fromCurrency === "USDC"
          ? Coinbase.assets.Usdc
          : Coinbase.assets.Eth;
      const toAssetId =
        swap.toCurrency === "USDC" ? Coinbase.assets.Usdc : Coinbase.assets.Eth;

      console.log(
        `Creating trade from ${swap.fromCurrency} to ${swap.toCurrency} for ${swap.amount} on ${swap.network}`
      );

      // Fetch sender wallet data from Supabase
      const { data: senderWalletData, error: senderWalletDataError } =
        await supabase.from("user").select("*").eq("omi_id", uid).single();

      if (senderWalletDataError) {
        throw new Error(`Wallet fetch error: ${senderWalletDataError.message}`);
      }

      const chosenNetwork = `${swap.network.toLowerCase()}_wallet`;

      // Instantiate the wallet using the Coinbase provider
      const fromWallet = await Wallet.import(
        senderWalletData[
          chosenNetwork as keyof typeof senderWalletData
        ] as WalletData
      );

      const trade = await fromWallet.createTrade({
        amount: swap.amount,
        fromAssetId: fromAssetId,
        toAssetId: toAssetId,
      });

      const tradeReceipt = await trade.wait();
      if (tradeReceipt.getStatus() !== TransactionStatus.COMPLETE) {
        throw new Error("Trade failed.");
      } else {
        await supabase.from("trade").insert({
          amount_deposit: swap.amount,
          amount_receive: tradeReceipt.getToAmount().toNumber(),
          device_uid: uid,
          from_currency: swap.fromCurrency,
          to_currency: swap.toCurrency,
          transcript: swap.transcript,
          txid: tradeReceipt.getId(),
          network: swap.network,
        });
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      `Webhook error: ${error instanceof Error ? error.message : `Unknown error: ${error}`}`,
      {
        status: 400,
      }
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
