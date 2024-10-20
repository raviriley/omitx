"use client";

import { Button } from "@/components/ui/button";
import { useSession, signIn, signOut } from "next-auth/react";

export function AuthButton() {
  const { data: session } = useSession();
  return (
    <Button onClick={session ? () => signOut() : () => signIn()}>
      {session ? "Logout" : "Login"}
    </Button>
  );
}
