import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const codeString = searchParams.get("code");

    if (!codeString) {
      return NextResponse.json(
        { error: "Usage code required" },
        { status: 400 },
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase configuration is missing on the server." },
        { status: 500 },
      );
    }

    // Fetch the code from the database
    const { data, error: fetchError } = await supabase
      .from("usage_codes")
      .select("*")
      .eq("code", codeString)
      .single();

    const codeData = data as any;

    if (fetchError || !codeData) {
      return NextResponse.json(
        { error: "Invalid usage code" },
        { status: 404 },
      );
    }

    // Check Expiry
    if (codeData.expiresAt && new Date() > new Date(codeData.expiresAt)) {
      return NextResponse.json(
        { error: "Usage code has expired" },
        { status: 403 },
      );
    }

    // Check daily reset
    const today = new Date().toISOString().split("T")[0];
    let usageToday = codeData.usageToday;
    if (codeData.lastReset !== today) {
      usageToday = 0;
    }

    return NextResponse.json({
      valid: true,
      usageToday,
      limitPerDay: codeData.limitPerDay,
      isUnlimited: codeData.limitPerDay === -1,
      expiresAt: codeData.expiresAt,
      activatedAt: codeData.activatedAt,
      durationDays: codeData.durationDays,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch usage" },
      { status: 500 },
    );
  }
}
