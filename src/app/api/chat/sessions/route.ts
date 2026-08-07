import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Visitor starts a chat, or admin lists sessions */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sessions = await prisma.chatSession.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return NextResponse.json(sessions);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chat = await prisma.chatSession.create({
      data: {
        visitorName: body.name || "Visitor",
        visitorEmail: body.email || null,
        status: "open",
        messages: body.message
          ? {
              create: {
                sender: "visitor",
                body: body.message,
              },
            }
          : undefined,
      },
      include: { messages: true },
    });
    return NextResponse.json(chat, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to start chat" }, { status: 500 });
  }
}
