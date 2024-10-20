// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

type Wallet = {
  walletId: string;
  seed: string;
};

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      omiId: string;
      wallet: Wallet;
      username: string;
    };
  }
}
