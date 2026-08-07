import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const items = await prisma.chatPendingQuestion.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.question?.trim()) {
      return NextResponse.json({ error: "question required" }, { status: 400 });
    }
    const item = await prisma.chatPendingQuestion.create({
      data: {
        question: body.question.trim(),
        sessionId: body.sessionId || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    // Convert pending question into FAQ answer
    if (body.createFaq) {
      await prisma.chatFaq.create({
        data: {
          question: body.question,
          answer: body.answer,
          options: body.options || [
            { label: "Talk to a human agent", action: "human" },
          ],
          sortOrder: 50,
        },
      });
    }
    if (body.id) {
      await prisma.chatPendingQuestion.update({
        where: { id: body.id },
        data: { resolved: true },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
