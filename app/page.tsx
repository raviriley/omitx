import { Wallet } from "@/providers/coinbase.provider";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/auth-options";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    const wallet = await Wallet.import(session.user?.wallet);
    const balances = await wallet.listBalances();
    return (
      <div className="p-4">
        <h1>Welcome {session.user?.username}</h1>
        <p>Your wallet is {session.user?.wallet.walletId}</p>
        <p>
          Your Omi ID is {session.user?.omiId} and your db ID is{" "}
          {session.user?.id}
        </p>
        <p>Your balances are {JSON.stringify(balances)}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1>Welcome to OmiTx</h1>
    </div>
  );
}
