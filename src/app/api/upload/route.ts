import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client using server-side service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase configuration is missing on the server." },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();

    const { fileName, fileData, mimeType, usageCode } = body;

    if (!fileName || !fileData) {
      return NextResponse.json(
        { error: "Missing required fields: fileName or fileData" },
        { status: 400 },
      );
    }

    // Strip out the base64 prefix if it exists
    const base64Data = fileData.includes("base64,")
      ? fileData.split("base64,")[1]
      : fileData;

    // Convert base64 string back into a binary buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Create a clean, unique file path grouped by their usage code
    const uniqueId =
      Date.now().toString(36) + Math.random().toString(36).substring(2);
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filePath = `${usageCode || "anonymous"}/${uniqueId}_${safeFileName}`;

    // Upload to a Supabase bucket named "uploads"
    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(filePath, buffer, {
        contentType: mimeType || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      console.error("Failed to upload to Supabase Storage:", error);
      return NextResponse.json(
        { error: "Failed to save file to cloud storage." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, path: data.path });
  } catch (error: any) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process upload request." },
      { status: 500 },
    );
  }
}
