import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: "Cloudinary is not configured. Add env vars." },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "nexus265";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowed = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
    ];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, GIF, WebP allowed" },
        { status: 400 }
      );
    }

    // Max 8MB
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 8MB)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
