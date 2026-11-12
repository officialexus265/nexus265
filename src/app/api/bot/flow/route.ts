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
    console.error("[bot/flow GET]", e);
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

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ error: "No nodes provided" }, { status: 400 });
    }

    // Ensure at least one welcome node exists in the payload
    const hasWelcome = nodes.some((n) => n.isWelcome);
    if (!hasWelcome) {
      // Find existing welcome or create a placeholder so we never lose the entry point
      const existingWelcome = await prisma.botNode.findFirst({
        where: { isWelcome: true },
      });
      if (existingWelcome) {
        nodes.unshift({
          id: existingWelcome.id,
          title: existingWelcome.title,
          body: existingWelcome.body,
          isWelcome: true,
          positionX: existingWelcome.positionX,
          positionY: existingWelcome.positionY,
          options: [],
        });
      }
    }

    // 1. Upsert all nodes first so foreign keys can resolve
    const keepIds: string[] = [];
    for (const n of nodes) {
      if (!n.id) continue;
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
          // keep isWelcome stable once set
          isWelcome: n.isWelcome ? true : undefined,
        },
      });
    }

    const validNodeIds = new Set(keepIds);

    // 2. Delete nodes that were removed from the editor (never delete the welcome node)
    const all = await prisma.botNode.findMany();
    for (const existing of all) {
      if (!keepIds.includes(existing.id) && !existing.isWelcome) {
        // Clear any options that pointed at this node first (FK safety)
        await prisma.botOption.updateMany({
          where: { nextNodeId: existing.id },
          data: { nextNodeId: null },
        });
        await prisma.botOption.deleteMany({ where: { nodeId: existing.id } });
        await prisma.botNode.delete({ where: { id: existing.id } });
      }
    }

    // 3. Replace options for every node that remains
    for (const n of nodes) {
      if (!n.id) continue;
      await prisma.botOption.deleteMany({ where: { nodeId: n.id } });

      let order = 0;
      for (const o of n.options || []) {
        if (!o.label?.trim()) continue;

        // Only allow nextNodeId that actually exists in this save payload
        const safeNext =
          o.nextNodeId && validNodeIds.has(o.nextNodeId) ? o.nextNodeId : null;

        // Normalize action
        let action = (o.action || "next").toLowerCase();
        if (action === "url") action = "url";
        else if (action === "human") action = "human";
        else if (action === "next_url") action = "next_url";
        else action = "next";

        await prisma.botOption.create({
          data: {
            // Re-use client id when it looks stable; otherwise let Prisma generate one
            id:
              o.id &&
              typeof o.id === "string" &&
              !o.id.startsWith("tmp-") &&
              !o.id.startsWith("local-")
                ? o.id
                : undefined,
            nodeId: n.id,
            label: o.label.trim(),
            action,
            nextNodeId: safeNext,
            url: o.url?.trim() || null,
            sortOrder: typeof o.sortOrder === "number" ? o.sortOrder : order++,
          },
        });
      }
    }

    const result = await prisma.botNode.findMany({
      include: { options: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ nodes: result });
  } catch (e) {
    console.error("[bot/flow PUT] Failed to save flow:", e);
    const message =
      e instanceof Error ? e.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Failed to save flow",
        detail: message,
      },
      { status: 500 }
    );
  }
}
