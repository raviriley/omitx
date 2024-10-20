"use server";

import { authOptions } from "@/app/api/auth/auth-options";
import { SupabaseProvider } from "@/providers/supabase.provider";
import { getServerSession } from "next-auth";

export async function updateOmiId(omiId: string) {
  const supabase = SupabaseProvider.supabase;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("user")
    .update({ omi_id: omiId })
    .eq("id", session.user.id);

  if (error) {
    console.error("Error updating Omi ID:", error);
    throw new Error("Failed to update Omi ID");
  }

  return { success: true };
}
