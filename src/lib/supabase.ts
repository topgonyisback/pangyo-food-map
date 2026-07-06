import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// URL/키가 없으면 로컬(localStorage) 모드로 폴백하기 위해 null을 반환합니다.
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export const isSupabaseConfigured = Boolean(url && key);
