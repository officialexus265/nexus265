import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// In-memory presence (works on single serverless instance; good enough for Phase 5)
// For multi-region, move to Redis/DB later.
type Presence = {
  online: boolean;
  busy: boolean;
  activeSessionId: string | null;
  updatedAt: number;
};

const g = globalThis as unknown as { __nexusPresence?: Presence };
if (!g.__nexusPresence) {
  g.__nexusPresence = {
    online: false,
    busy: false,
    activeSessionId: null,
    updatedAt: 0,
  };
}

export async function GET() {
  const p = g.__nexusPresence!;
  const stale = Date.now() - p.updatedAt > 45_000; // 45s without heartbeat = offline
  return NextResponse.json({
    online: !stale && p.online,
    busy: !stale && p.busy,
    activeSessionId: !stale ? p.activeSessionId : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    g.__nexusPresence = {
      online: body.online !== false,
      busy: !!body.busy,
      activeSessionId: body.activeSessionId || null,
      updatedAt: Date.now(),
    };
    return NextResponse.json(g.__nexusPresence);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
