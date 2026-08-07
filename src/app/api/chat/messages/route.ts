import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionId = new URL(req.url).searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(messages);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, text, sender } = body;
    if (!sessionId || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const isAdmin = sender === "admin";
    if (isAdmin) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        sender: isAdmin ? "admin" : "visitor",
        body: text,
      },
    });

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: isAdmin ? "active" : "open",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
