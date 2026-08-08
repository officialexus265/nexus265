import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_WELCOME =
  "Hi! Welcome to nexus265. How can I help you today? Pick an option below, or type your question.";

async function ensureWelcome() {
  const existing = await prisma.botNode.findFirst({ where: { isWelcome: true } });
  if (existing) return existing;
  return prisma.botNode.create({
    data: {
      kind: "welcome",
      title: "Welcome",
      body: DEFAULT_WELCOME,
      isWelcome: true,
      positionX: 250,
      positionY: 50,
    },
  });
}

/** Public + admin: full flow graph */
export async function GET() {
  try {
    await ensureWelcome();
    const nodes = await prisma.botNode.findMany({
      include: { options: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ nodes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({
      nodes: [
        {
          id: "local-welcome",
          kind: "welcome",
          title: "Welcome",
          body: DEFAULT_WELCOME,
          isWelcome: true,
          positionX: 250,
          positionY: 50,
          options: [
            {
              id: "o1",
              label: "Talk to a human agent",
              action: "human",
              sortOrder: 0,
              nextNodeId: null,
              url: null,
            },
          ],
        },
      ],
    });
  }
}

/** Save full graph (admin) */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const nodes: Array<{
      id: string;
      title: string;
      body: string;
      kind?: string;
      isWelcome?: boolean;
      positionX: number;
      positionY: number;
      options: Array<{
        id?: string;
        label: string;
        action: string;
        nextNodeId?: string | null;
        url?: string | null;
        sortOrder?: number;
      }>;
    }> = body.nodes || [];

    // Upsert nodes
    const keepIds: string[] = [];
    for (const n of nodes) {
      keepIds.push(n.id);
      await prisma.botNode.upsert({
        where: { id: n.id },
        create: {
          id: n.id,
          title: n.title || "Message",
          body: n.body || "",
          kind: n.isWelcome ? "welcome" : n.kind || "message",
          isWelcome: !!n.isWelcome,
          positionX: n.positionX ?? 0,
          positionY: n.positionY ?? 0,
        },
        update: {
          title: n.title || "Message",
          body: n.body || "",
          positionX: n.positionX ?? 0,
          positionY: n.positionY ?? 0,
        },
      });
    }

    // Delete removed nodes (except always keep welcome)
    const all = await prisma.botNode.findMany();
    for (const existing of all) {
      if (!keepIds.includes(existing.id) && !existing.isWelcome) {
        await prisma.botOption.deleteMany({ where: { nodeId: existing.id } });
        await prisma.botNode.delete({ where: { id: existing.id } });
      }
    }

    // Replace options per node
    for (const n of nodes) {
      await prisma.botOption.deleteMany({ where: { nodeId: n.id } });
      let order = 0;
      for (const o of n.options || []) {
        if (!o.label?.trim()) continue;
        await prisma.botOption.create({
          data: {
            id: o.id && !o.id.startsWith("tmp-") ? o.id : undefined,
            nodeId: n.id,
            label: o.label.trim(),
            action: o.action || "next",
            nextNodeId: o.nextNodeId || null,
            url: o.url || null,
            sortOrder: o.sortOrder ?? order++,
          },
        });
      }
    }

    const result = await prisma.botNode.findMany({
      include: { options: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json({ nodes: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save flow" }, { status: 500 });
  }
}
