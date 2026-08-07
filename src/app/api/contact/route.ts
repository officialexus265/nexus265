import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
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

    // Destination: settings DB → CONTACT_TO_EMAIL → default
    let to = process.env.CONTACT_TO_EMAIL || "officialnexus265@gmail.com";
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { id: "default" },
      });
      if (settings?.email) to = settings.email;
    } catch {
      /* ignore */
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from =
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      "noreply@nexus265.com";

    if (!host || !user || !pass) {
      console.error("SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587/STARTTLS
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"${name} via nexus265" <${from}>`,
      to,
      replyTo: email,
      subject: subject || `Message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: `
        <div style="font-family:sans-serif;line-height:1.6">
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p><strong>Subject:</strong> ${subject || "(none)"}</p>
          <hr/>
          <p>${String(message).replace(/\n/g, "<br/>")}</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, method: "smtp" });
  } catch (e) {
    console.error("SMTP error:", e);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
