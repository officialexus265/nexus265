import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forSale = searchParams.get("forSale");
    const publicOnly = searchParams.get("public") === "1";

    const websites = await prisma.website.findMany({
      where: forSale === "1" ? { isForSale: true } : undefined,
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    });

    if (publicOnly) {
      const publicData = websites.map(({ privateNotes, ...rest }) => rest);
      return NextResponse.json(publicData);
    }

    // Private notes only if authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      const publicData = websites.map(({ privateNotes, ...rest }) => rest);
      return NextResponse.json(publicData);
    }

    return NextResponse.json(websites);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const website = await prisma.website.create({
      data: {
        title: body.title,
        description: body.description,
        longDescription: body.longDescription || null,
        thumbnail: body.thumbnail,
        liveUrl: body.liveUrl,
        demoUrl: body.demoUrl || null,
        isForSale: !!body.isForSale,
        oldPrice: body.oldPrice ?? null,
        newPrice: body.newPrice ?? null,
        tags: body.tags || [],
        privateNotes: body.privateNotes || null,
        featured: !!body.featured,
      },
    });

    return NextResponse.json(website, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
