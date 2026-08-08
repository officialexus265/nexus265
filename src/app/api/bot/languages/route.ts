import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let langs = await prisma.botLanguage.findMany({ orderBy: { name: "asc" } });
    if (langs.length === 0) {
      await prisma.botLanguage.create({
        data: { code: "en", name: "English", isActive: true, isDefault: true },
      });
      langs = await prisma.botLanguage.findMany();
    }
    return NextResponse.json(langs);
  } catch {
    return NextResponse.json([
      { id: "en", code: "en", name: "English", isActive: true, isDefault: true },
    ]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    if (!body.code || !body.name) {
      return NextResponse.json({ error: "code and name required" }, { status: 400 });
    }
    const lang = await prisma.botLanguage.create({
      data: {
        code: String(body.code).toLowerCase(),
        name: body.name,
        isActive: !!body.isActive,
        isDefault: false,
      },
    });
    return NextResponse.json(lang, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed (code may already exist)" }, { status: 500 });
  }
}
