import { Wallet } from "@/providers/coinbase.provider";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/auth-options";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SupabaseProvider } from "@/providers/supabase.provider";
import { WalletData } from "@coinbase/coinbase-sdk";
import Image from "next/image";
import CopyButton from "@/components/copy-button";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";

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

    const transactionsData = await supabase
      .from("transaction")
      .select("*")
      .eq("from", session.user?.username)
      .order("timestamp", { ascending: false });

    const transactions = transactionsData.data?.map((transaction) => ({
      timestamp: new Date(transaction.created_at),
      hash: transaction.txid || "",
      to: transaction.to || "",
      amount: transaction.amount || 0,
      chain: transaction.chain || "",
    }));

    return (
      <div className="p-6">
        <div className="mb-4 flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-extrabold text-white mb-4 md:mb-0">
            Dashboard
          </h1>
          <div className="flex flex-col items-end">
            <p className="text-sm text-indigo-100 font-medium">
              {session.user?.omiId && (
                <>
                  <span className="font-bold">{session.user?.username}</span>
                  &apos;s Omi ID:{" "}
                  <span className="bg-indigo-700 px-2 py-1 rounded-md">
                    {session.user?.omiId}
                  </span>
                </>
              )}
            </p>
            <p className="text-xs text-indigo-200 mt-2">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(walletsWithBalances).map(
            async ([chain, { wallet, address, balances }]) => (
              <Card key={chain}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Image
                      src={`/${chain.toLowerCase()}-logo.svg`}
                      alt={`${chain} logo`}
                      className="max-w-8 max-h-8"
                      width={32}
                      height={32}
                    />
                    <CardTitle className="capitalize">{chain}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col">
                    <span className="font-bold">Address:</span>{" "}
                    <div className="flex flex-row">
                      <p className="text-sm font-medium truncate">
                        {address.getId()}
                      </p>
                      <CopyButton
                        className="ml-2"
                        value={address.getId()}
                        toastMessage={`Copied ${chain} address to clipboard`}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-bold mt-1">Balances</p>
                  <ul className="">
                    {balances.size === 0 ? (
                      <>
                        <li className="text-sm">
                          No tokens, fund your wallet to transact
                        </li>
                      </>
                    ) : (
                      Array.from(balances.entries()).map(
                        ([assetId, balance]) => (
                          <li key={assetId} className="text-sm">
                            {balance.toString()} {assetId.toUpperCase()}
                          </li>
                        ),
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            ),
          )}
        </div>
        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Latest Transactions</CardTitle>
              <CardDescription>Card Description</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={transactions || []} />
            </CardContent>
          </Card>
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
