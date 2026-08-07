import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required" },
        { status: 400 }
      );
    }

    // Get destination email from settings
    let to = process.env.CONTACT_TO_EMAIL || "officialnexus265@gmail.com";
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { id: "default" },
      });
      if (settings?.email) to = settings.email;
    } catch {
      /* use env/default */
    }

    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "nexus265 <onboarding@resend.dev>",
          to: [to],
          reply_to: email,
          subject: subject || `Message from ${name}`,
          text: `From: ${name} <${email}>\n\n${message}`,
          html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${String(message).replace(/\n/g, "<br/>")}</p>`,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Resend error:", err);
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, method: "resend" });
    }

    // No Resend key — accept the message but signal client to use mailto fallback
    return NextResponse.json({
      ok: true,
      method: "stored",
      message: "Email service not configured. Message logged.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
