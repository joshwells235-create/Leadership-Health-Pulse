import { createServerSupabaseClient } from "./supabase-server";

// Verify the request is from an authenticated admin user.
// Returns the supabase client and user, or null if not authenticated.
export async function verifyAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return { supabase, user };
}
