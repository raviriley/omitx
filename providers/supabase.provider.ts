import { createClient } from "@supabase/supabase-js";
import { Database } from "@/database.types";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABSE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export const SupabaseProvider = {
  supabase,
};
