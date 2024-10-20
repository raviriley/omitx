import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";

const coinbaseClient = Coinbase.configure({
  apiKeyName: process.env["COINBASE_API_KEY"]!,
  privateKey: process.env["COINBASE_API_SECRET"]!,
});

export { coinbaseClient, Wallet, Coinbase };
