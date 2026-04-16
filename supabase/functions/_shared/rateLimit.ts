import { createClient } from "npm:@supabase/supabase-js@^2.100.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://qrswutkoygynhtzpxqfi.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Limits per function per hour
const LIMITS: Record<string, number> = {
  "gshop-ai": 30,
  "medieat-mealplan": 15,
  "medieat-chat": 40,
};

export async function checkRateLimit(
  identifier: string,
  functionName: string
): Promise<{ allowed: boolean; remaining: number; resetSeconds: number }> {
  const limit = LIMITS[functionName] || 20;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  // Count recent requests
  const { count, error: countError } = await supabase
    .from("ai_rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("function_name", functionName)
    .gte("created_at", oneHourAgo);

  if (countError) {
    console.error("Rate limit check failed:", countError);
    // Fail open — allow the request if rate limit check fails
    return { allowed: true, remaining: limit, resetSeconds: 0 };
  }

  const used = count || 0;
  const remaining = Math.max(0, limit - used);

  if (used >= limit) {
    // Find oldest entry to calculate reset time
    const { data: oldest } = await supabase
      .from("ai_rate_limits")
      .select("created_at")
      .eq("identifier", identifier)
      .eq("function_name", functionName)
      .gte("created_at", oneHourAgo)
      .order("created_at", { ascending: true })
      .limit(1);

    const resetAt = oldest?.[0]
      ? new Date(oldest[0].created_at).getTime() + 3600000
      : Date.now() + 3600000;
    const resetSeconds = Math.ceil((resetAt - Date.now()) / 1000);

    return { allowed: false, remaining: 0, resetSeconds };
  }

  // Record this request
  await supabase.from("ai_rate_limits").insert({
    identifier,
    function_name: functionName,
  });

  // Cleanup old entries (older than 2 hours) — fire and forget
  supabase
    .from("ai_rate_limits")
    .delete()
    .lt("created_at", new Date(Date.now() - 7200000).toISOString())
    .then(() => {});

  return { allowed: true, remaining: remaining - 1, resetSeconds: 0 };
}

export function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
