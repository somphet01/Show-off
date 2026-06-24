"use client";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseBrowserEnv } from "./env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseBrowserEnv();
  return createClient(url, anonKey);
}
