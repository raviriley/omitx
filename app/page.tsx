"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

export default function LoginPage() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="p-4">
        <h1>Welcome {session.user?.username}</h1>
        <p>Your polygon wallet is {session.user?.walletAddress}</p>
        <p>
          Your Omi ID is {session.user?.omiId} and your db ID is{" "}
          {session.user?.id}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1>Welcome to OmiTx</h1>
    </div>
  );
}
