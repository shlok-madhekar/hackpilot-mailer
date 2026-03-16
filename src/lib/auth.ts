import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
// These environment variables need to be set in Vercel/local .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function checkAndIncrementUsage(
  codeString: string,
  incrementAmount: number = 0,
): Promise<{ valid: boolean; error?: string }> {
  if (!codeString) return { valid: false, error: "Usage code required." };

  if (!supabase) {
    return {
      valid: false,
      error: "Supabase configuration is missing on the server.",
    };
  }

  try {
    // 1. Fetch the code from the database
    const { data, error: fetchError } = await supabase
      .from("usage_codes")
      .select("*")
      .eq("code", codeString)
      .single();

    const codeData = data as any;

    if (fetchError || !codeData) {
      return { valid: false, error: "Invalid usage code." };
    }

    let hasChanges = false;
    const updates: any = {};

    // 2. Activate code on first use (only if actually using/incrementing)
    if (
      incrementAmount > 0 &&
      codeData.durationDays !== null &&
      !codeData.activatedAt
    ) {
      const activatedAt = new Date();
      updates.activatedAt = activatedAt.toISOString();

      const expDate = new Date(activatedAt);
      expDate.setDate(expDate.getDate() + codeData.durationDays);
      updates.expiresAt = expDate.toISOString();

      codeData.activatedAt = updates.activatedAt;
      codeData.expiresAt = updates.expiresAt;
      hasChanges = true;
    }

    // 3. Check Expiry
    if (codeData.expiresAt && new Date() > new Date(codeData.expiresAt)) {
      return { valid: false, error: "Usage code has expired." };
    }

    // 4. Check Daily Reset
    const today = new Date().toISOString().split("T")[0];
    if (codeData.lastReset !== today) {
      codeData.usageToday = 0;
      updates.usageToday = 0;
      updates.lastReset = today;
      hasChanges = true;
    }

    // 5. Check Limit
    if (
      codeData.limitPerDay !== -1 &&
      codeData.usageToday >= codeData.limitPerDay
    ) {
      return { valid: false, error: "Daily limit reached for this code." };
    }

    // 6. Apply Increment
    if (incrementAmount > 0) {
      updates.usageToday =
        (updates.usageToday ?? codeData.usageToday) + incrementAmount;
      hasChanges = true;
    }

    // 7. Save Changes to Supabase
    if (hasChanges) {
      // Need to cast as any to bypass strict un-inferred generic typing on update payload
      const { error: updateError } = await (supabase.from("usage_codes") as any)
        .update(updates)
        .eq("code", codeString);

      if (updateError) {
        console.error("Failed to update usage code in Supabase:", updateError);
        return { valid: false, error: "Failed to update usage limits." };
      }
    }

    return { valid: true };
  } catch (err: any) {
    console.error("Supabase Auth Error:", err);
    return { valid: false, error: "Database connection error." };
  }
}
