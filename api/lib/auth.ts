import { getSupabaseAdmin } from "./supabase.js";

export function getBearerToken(headers?: Record<string, string | string[] | undefined>) {
  const value = headers?.authorization;
  const authorization = Array.isArray(value) ? value[0] : value;
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice(7).trim() || null;
}
export async function getVerifiedUser(
  headers?: Record<string, string | string[] | undefined>,
) {
  const token = getBearerToken(headers);
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
