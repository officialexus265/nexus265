import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const website = await prisma.website.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        longDescription: true,
        thumbnail: true,
        galleryImages: true,
        liveUrl: true,
        demoUrl: true,
        isForSale: true,
        oldPrice: true,
        newPrice: true,
        tags: true,
        featured: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!website) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json(website);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const website = await prisma.website.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        longDescription: body.longDescription || null,
        thumbnail: body.thumbnail,
        galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages.filter((url: unknown) => typeof url === "string") : [],
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

    return NextResponse.json(website);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.website.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
