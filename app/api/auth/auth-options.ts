import CredentialsProvider from "next-auth/providers/credentials";
import { SupabaseProvider } from "@/providers/supabase.provider";
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

        const { data: user, error } = await supabase
          .from("user")
          .upsert({
            username: credentials.username,
            hash: credentials.password,
            wallet: {
              walletId: "",
              seed: "",
            },
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
      console.log("session", session);
      console.log("token", token);
      const { data: user } = await supabase
        .from("user")
        .select("*")
        .eq("id", token.sub)
        .single();

      if (user) {
        session.user = {
          id: user.id.toString(),
          omiId: user.omi_id,
          wallet: user.wallet,
          username: user.username,
        };
      }

      return session;
    },
  },
};
