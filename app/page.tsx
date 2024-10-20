import { Wallet } from "@/providers/coinbase.provider";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/auth-options";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SupabaseProvider } from "@/providers/supabase.provider";
import { WalletData } from "@coinbase/coinbase-sdk";
import Image from "next/image";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    const supabase = SupabaseProvider.supabase;
    const { data } = await supabase
      .from("user")
      .select("*")
      .eq("id", session.user?.id)
      .single();

    const baseWallet = await Wallet.import(data?.base_wallet as WalletData);
    const polygonWallet = await Wallet.import(
      data?.polygon_wallet as WalletData,
    );
    const arbitrumWallet = await Wallet.import(
      data?.arbitrum_wallet as WalletData,
    );
    const ethereumWallet = await Wallet.import(data?.eth_wallet as WalletData);

    const baseAddress = await baseWallet.getDefaultAddress();
    const baseBalances = await baseAddress.listBalances();

    const polygonAddress = await polygonWallet.getDefaultAddress();
    const polygonBalances = await polygonAddress.listBalances();

    const arbitrumAddress = await arbitrumWallet.getDefaultAddress();
    const arbitrumBalances = await arbitrumAddress.listBalances();

    const ethereumAddress = await ethereumWallet.getDefaultAddress();
    const ethereumBalances = await ethereumAddress.listBalances();

    const walletsWithBalances = {
      base: {
        wallet: baseWallet,
        address: baseAddress,
        balances: baseBalances,
      },
      polygon: {
        wallet: polygonWallet,
        address: polygonAddress,
        balances: polygonBalances,
      },
      arbitrum: {
        wallet: arbitrumWallet,
        address: arbitrumAddress,
        balances: arbitrumBalances,
      },
      ethereum: {
        wallet: ethereumWallet,
        address: ethereumAddress,
        balances: ethereumBalances,
      },
    };

    return (
      <div className="p-4">
        <h1>Welcome {session.user?.username}</h1>
        <p>
          Your Omi ID is {session.user?.omiId} and your db ID is{" "}
          {session.user?.id}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(walletsWithBalances).map(
            async ([chain, { wallet, address, balances }]) => (
              <Card key={chain}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Image
                      src={`/${chain.toLowerCase()}-logo.svg`}
                      alt={`${chain} logo`}
                      className="max-w-6 max-h-6"
                      width={24}
                      height={24}
                    />
                    <CardTitle className="capitalize">{chain}</CardTitle>
                  </div>
                  <CardDescription>
                    Wallet and balance information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">
                    Address: {address.getId()}
                  </p>
                  <ul className="mt-2">
                    {Object.entries(balances).length === 0 ? (
                      <>
                        <li className="text-sm">ETH: 0</li>
                        <li className="text-sm">USDC: 0</li>
                      </>
                    ) : (
                      Object.entries(balances).map(([assetId, balance]) => (
                        <li key={assetId} className="text-sm">
                          {balance.asset.symbol}: {balance.amount.toString()}
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-gray-500">
                    Last updated: {new Date().toLocaleString()}
                  </p>
                </CardFooter>
              </Card>
            ),
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1>Welcome to OmiTx. Please login to continue.</h1>
    </div>
  );
}
