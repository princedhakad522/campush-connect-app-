import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function signedFileUrl(bucket: string, path: string | undefined | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function publicFileUrl(bucket: string, path: string | undefined | null) {
  return signedFileUrl(bucket, path);
}