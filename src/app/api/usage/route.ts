import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const codesPath = path.join(process.cwd(), "src/lib/codes.json");

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

    if (!fs.existsSync(codesPath)) {
      return NextResponse.json(
        { error: "Codes database not found" },
        { status: 500 },
      );
    }

    const codes = JSON.parse(fs.readFileSync(codesPath, "utf8"));
    const code = codes.find((c: any) => c.code === codeString);

    if (!code) {
      return NextResponse.json(
        { error: "Invalid usage code" },
        { status: 404 },
      );
    }

    // Check Expiry
    if (code.expiresAt && new Date() > new Date(code.expiresAt)) {
      return NextResponse.json(
        { error: "Usage code has expired" },
        { status: 403 },
      );
    }

    // Check daily reset
    const today = new Date().toISOString().split("T")[0];
    let usageToday = code.usageToday;
    if (code.lastReset !== today) {
      usageToday = 0;
    }

    return NextResponse.json({
      valid: true,
      usageToday,
      limitPerDay: code.limitPerDay,
      isUnlimited: code.limitPerDay === -1,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch usage" },
      { status: 500 },
    );
  }
}
