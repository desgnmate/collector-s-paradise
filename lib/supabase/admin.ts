import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

export class SupabaseAdminConfigurationError extends Error {
  constructor() {
    super('SUPABASE_SERVICE_ROLE_KEY is required for admin operations.');
    this.name = 'SupabaseAdminConfigurationError';
  }
}

/**
 * Returns the server-only Supabase client used for privileged admin reads and
 * writes. Never import this module from a Client Component or expose the
 * service-role key through a NEXT_PUBLIC_ variable.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new SupabaseAdminConfigurationError();
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return adminClient;
}
