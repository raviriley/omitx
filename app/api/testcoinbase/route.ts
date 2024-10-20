import { Coinbase, Wallet } from "@/providers/coinbase.provider";
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: NextRequest) {
  try {
    const newWallet = await Wallet.create({
      networkId: Coinbase.networks.BaseSepolia,
    });

    return NextResponse.json(newWallet.export(), { status: 201 });
  } catch (error) {
    console.error("Error creating wallet:", error);
    return NextResponse.json(
      { error: "Failed to create wallet" },
      { status: 500 }
    );
  }
}
