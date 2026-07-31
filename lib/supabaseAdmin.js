import { createClient } from '@supabase/supabase-js';

// SERVER-ONLY client using the service_role key. This bypasses Row Level
// Security, so it must never be imported into a Client Component or exposed
// to the browser. Used only inside Route Handlers for privileged actions
// like creating a new salesman auth account from the Admin Dashboard.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set on the server.');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
