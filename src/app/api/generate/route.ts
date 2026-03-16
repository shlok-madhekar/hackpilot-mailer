import { NextResponse } from "next/server";
import { checkAndIncrementUsage } from "@/lib/auth";

const HACKCLUB_API_KEY = process.env.HACKCLUB_API_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, usageCode, isRegeneration, temperature = 0.7 } = body;

    const cost = isRegeneration ? 0.5 : 1;
    const usageCheck = checkAndIncrementUsage(usageCode, cost);
    if (!usageCheck.valid) {
      return NextResponse.json({ error: usageCheck.error }, { status: 403 });
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing required fields: prompt" },
        { status: 400 },
      );
    }

    // 1. Try Hack Club API First
    try {
      if (!HACKCLUB_API_KEY) throw new Error("Missing HACKCLUB_API_KEY");

      const hcResponse = await fetch(
        "https://ai.hackclub.com/proxy/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${HACKCLUB_API_KEY}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            temperature: temperature,
          }),
        },
      );

      if (hcResponse.ok) {
        const data = await hcResponse.json();
        return NextResponse.json(data);
      } else {
        const errorData = await hcResponse.text();
        console.warn(
          "Hack Club API failed, falling back to Groq:",
          hcResponse.status,
          errorData,
        );
      }
    } catch (hcError) {
      console.warn(
        "Hack Club API network error, falling back to Groq:",
        hcError,
      );
    }

    // 2. Fallback to Groq API
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing GROQ_API_KEY" },
        { status: 500 },
      );
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: temperature,
        }),
      },
    );

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error("Groq API Error:", groqResponse.status, errorData);
      return NextResponse.json(
        { error: `Groq API error ${groqResponse.status}: ${errorData}` },
        { status: groqResponse.status },
      );
    }

    const data = await groqResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Generation API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate email" },
      { status: 500 },
    );
  }
}
