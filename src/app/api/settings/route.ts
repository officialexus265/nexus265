import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: "default" },
      });
    }

    return NextResponse.json(settings);
  } catch (e) {
    console.error(e);
    // Fallback if DB not ready
    return NextResponse.json({
      id: "default",
      siteName: "nexus265",
      tagline: "where ideas connect.",
      logo: null,
      heroImage: null,
      email: "officialnexus265@gmail.com",
      phone: "+265999939040",
      whatsapp: "265999939040",
      social: {},
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {
        siteName: body.siteName,
        tagline: body.tagline,
        logo: body.logo || null,
        heroImage: body.heroImage || null,
        favicon: body.favicon || null,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
        social: body.social || {},
        slides: body.slides || null,
      },
      create: {
        id: "default",
        siteName: body.siteName || "nexus265",
        tagline: body.tagline || "where ideas connect.",
        logo: body.logo || null,
        heroImage: body.heroImage || null,
        favicon: body.favicon || null,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
        social: body.social || {},
        slides: body.slides || null,
      },
    });

    return NextResponse.json(settings);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
