import { WalletData } from "@coinbase/coinbase-sdk";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      omiId: string;
      username: string;
      baseWallet: WalletData;
      solanaWallet: WalletData;
      polygonWallet: WalletData;
      arbitrumWallet: WalletData;
      ethereumWallet: WalletData;
    };
  }
}
