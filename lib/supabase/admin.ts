import { createClient } from "@supabase/supabase-js";

// Server-only, bypasses row-level security — never import into a
// "use client" file. Only use after independently verifying the action
// is legitimate (e.g. confirming a payment with Stripe's API directly),
// never based on a claim the browser sends us.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
