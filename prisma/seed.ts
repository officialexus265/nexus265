import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "officialnexus265@gmail.com";
  const password = process.env.ADMIN_PASSWORD || "nexus265admin";

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { password: hashed },
    create: {
      email,
      password: hashed,
      name: "Admin",
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "nexus265",
      tagline: "where ideas connect.",
      email: "officialnexus265@gmail.com",
      phone: "+265999939040",
      whatsapp: "265999939040",
      social: {
        facebook: "",
        x: "",
        linkedin: "",
        gmail: "mailto:officialnexus265@gmail.com",
        tiktok: "",
      },
    },
  });

  const count = await prisma.website.count();
  if (count === 0) {
    await prisma.website.createMany({
      data: [
        {
          title: "Aether Commerce",
          description:
            "A high-performance e-commerce platform with real-time inventory, multi-currency support and a beautiful storefront.",
          longDescription:
            "Built for scale. Features include product variants, wishlist, advanced filtering, Stripe & Paychangu ready checkout.",
          thumbnail:
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
          liveUrl: "https://example-aether.com",
          demoUrl: "https://example-aether.com/demo",
          isForSale: true,
          oldPrice: 1200,
          newPrice: 849,
          tags: ["Next.js", "E-commerce", "Stripe"],
          privateNotes:
            "Deployed on Vercel. Stack: Next.js 15, Prisma, PostgreSQL. Credentials in password manager.",
          featured: true,
        },
        {
          title: "Nova Analytics Dashboard",
          description:
            "Real-time analytics and business intelligence dashboard with beautiful charts and customizable widgets.",
          thumbnail:
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
          liveUrl: "https://example-nova.com",
          isForSale: true,
          oldPrice: 950,
          newPrice: 699,
          tags: ["React", "Dashboard", "Charts"],
          privateNotes: "Hosted on Railway. Stack: React + Vite, Recharts, Supabase.",
          featured: true,
        },
        {
          title: "Pulse SaaS Starter",
          description:
            "Complete SaaS boilerplate with auth, billing, teams, and beautiful UI.",
          thumbnail:
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
          liveUrl: "https://example-pulse.com",
          demoUrl: "https://example-pulse.com/demo",
          isForSale: true,
          oldPrice: 1499,
          newPrice: 999,
          tags: ["SaaS", "Next.js", "Auth"],
          privateNotes: "Vercel + Supabase. NextAuth, Stripe, Tailwind.",
          featured: true,
        },
      ],
    });
  }

  console.log("Seed complete. Admin:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
