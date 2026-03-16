import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { checkAndIncrementUsage } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      gmailUser,
      gmailPass,
      senderName,
      to,
      cc,
      subject,
      text,
      usageCode,
      attachmentBase64,
      attachmentName,
    } = body;

    const usageCheck = await checkAndIncrementUsage(usageCode, 0);
    if (!usageCheck.valid) {
      return NextResponse.json({ error: usageCheck.error }, { status: 403 });
    }

    if (!gmailUser || !gmailPass || !to || !subject || !text) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: gmailUser, gmailPass, to, subject, text",
        },
        { status: 400 },
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const mailOptions: any = {
      from: senderName ? `"${senderName}" <${gmailUser}>` : gmailUser,
      to,
      cc,
      subject,
      text,
    };

    if (attachmentBase64 && attachmentName) {
      const base64Data = attachmentBase64.includes("base64,")
        ? attachmentBase64.split("base64,")[1]
        : attachmentBase64;

      mailOptions.attachments = [
        {
          filename: attachmentName,
          content: base64Data,
          encoding: "base64",
        },
      ];
    }

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 },
    );
  }
}
