import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_MENU = [
  {
    question: "Browse my websites",
    answer:
      "You can explore all my live projects on the home page, or check projects marked for sale.",
    options: [
      { label: "Go to websites", href: "/#websites" },
      { label: "Projects for sale", href: "/selling" },
      { label: "Talk to a human agent", action: "human" },
    ],
    sortOrder: 1,
  },
  {
    question: "Hire you for a project",
    answer:
      "Great! I build custom websites, SaaS, dashboards and more. Share a short brief or jump to the contact form.",
    options: [
      { label: "Open contact / hire form", href: "/contact#hire" },
      { label: "Talk to a human agent", action: "human" },
    ],
    sortOrder: 2,
  },
  {
    question: "Buy a project",
    answer:
      "Projects for sale are listed with prices. You can view demos and negotiate.",
    options: [
      { label: "View for-sale projects", href: "/selling" },
      { label: "Talk to a human agent", action: "human" },
    ],
    sortOrder: 3,
  },
  {
    question: "Talk to a human agent",
    answer:
      "Connecting you to the developer. Type your message below and they'll reply as soon as possible.",
    options: [{ label: "Talk to a human agent", action: "human" }],
    sortOrder: 4,
  },
];

export async function GET() {
  try {
    let faqs = await prisma.chatFaq.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
    });

    if (faqs.length === 0) {
      // seed defaults once
      await prisma.chatFaq.createMany({
        data: DEFAULT_MENU.map((f) => ({
          question: f.question,
          answer: f.answer,
          options: f.options,
          sortOrder: f.sortOrder,
        })),
      });
      faqs = await prisma.chatFaq.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { sortOrder: "asc" },
      });
    }

    return NextResponse.json(faqs);
  } catch (e) {
    console.error(e);
    // DB not ready — return static defaults
    return NextResponse.json(
      DEFAULT_MENU.map((f, i) => ({
        id: `default-${i}`,
        ...f,
        parentId: null,
        isActive: true,
      }))
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const faq = await prisma.chatFaq.create({
      data: {
        question: body.question,
        answer: body.answer,
        options: body.options || [],
        parentId: body.parentId || null,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive !== false,
      },
    });
    return NextResponse.json(faq, { status: 201 });
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
    const faq = await prisma.chatFaq.update({
      where: { id: body.id },
      data: {
        question: body.question,
        answer: body.answer,
        options: body.options || [],
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive !== false,
      },
    });
    return NextResponse.json(faq);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.chatFaq.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
