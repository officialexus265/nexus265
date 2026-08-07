import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, newEmail } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentPassword) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Current password is wrong" }, { status: 400 });
      }
    } else if (newPassword || newEmail) {
      return NextResponse.json(
        { error: "Current password required" },
        { status: 400 }
      );
    }

    const data: { password?: string; email?: string } = {};

    if (newPassword) {
      if (String(newPassword).length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      data.password = await bcrypt.hash(newPassword, 12);
    }

    if (newEmail && newEmail !== user.email) {
      const exists = await prisma.user.findUnique({ where: { email: newEmail } });
      if (exists) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
      data.email = newEmail;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data,
    });

    return NextResponse.json({
      ok: true,
      emailChanged: !!data.email,
      passwordChanged: !!data.password,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
