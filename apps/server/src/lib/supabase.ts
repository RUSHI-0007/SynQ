import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Initialize a singleton Supabase client for the backend using the Service Role Key
// The Service Role Key allows bypassing RLS policies for server-side trusted operations.
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);
