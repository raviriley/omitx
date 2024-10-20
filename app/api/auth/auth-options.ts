import CredentialsProvider from "next-auth/providers/credentials";
import { SupabaseProvider } from "@/providers/supabase.provider";
import { Coinbase, Wallet } from "@/providers/coinbase.provider";
import { NextAuthOptions } from "next-auth";

const supabase = SupabaseProvider.supabase;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "satoshi" },
        password: { label: "Password", type: "password" },
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const newBaseWallet = await Wallet.create({
          networkId: Coinbase.networks.BaseMainnet,
        });
        const newSolanaWallet = await Wallet.create({
          networkId: Coinbase.networks.SolanaMainnet,
        });
        const newPolygonWallet = await Wallet.create({
          networkId: Coinbase.networks.PolygonMainnet,
        });
        const newArbitrumWallet = await Wallet.create({
          networkId: Coinbase.networks.ArbitrumMainnet,
        });
        const newEthereumWallet = await Wallet.create({
          networkId: Coinbase.networks.EthereumMainnet,
        });

        const { data: user, error } = await supabase
          .from("user")
          .upsert({
            username: credentials.username,
            hash: credentials.password,
            base_wallet: newBaseWallet.export(),
            sol_wallet: newSolanaWallet.export(),
            polygon_wallet: newPolygonWallet.export(),
            arbitrum_wallet: newArbitrumWallet.export(),
            eth_wallet: newEthereumWallet.export(),
          })
          .select()
          .single();

        if (error || !user) {
          return null;
        }

        return {
          id: user.id.toString(),
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      const { data: user } = await supabase
        .from("user")
        .select("*")
        .eq("id", token.sub)
        .single();

      if (user) {
        session.user = {
          id: user.id.toString(),
          omiId: user.omi_id,
          username: user.username,
        };
      }

      return session;
    },
  },
};
