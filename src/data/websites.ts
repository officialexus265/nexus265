import { Website } from "@/types";

export const mockWebsites: Website[] = [
  {
    id: "1",
    title: "Aether Commerce",
    description:
      "A high-performance e-commerce platform with real-time inventory, multi-currency support and a beautiful storefront.",
    longDescription:
      "Built for scale. Features include product variants, wishlist, advanced filtering, Stripe & Paychangu ready checkout, admin dashboard with analytics, and PWA support.",
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    liveUrl: "https://example-aether.com",
    demoUrl: "https://example-aether.com/demo",
    isForSale: true,
    oldPrice: 1200,
    newPrice: 849,
    tags: ["Next.js", "E-commerce", "Stripe"],
    privateNotes:
      "Deployed on Vercel. Stack: Next.js 15, Prisma, PostgreSQL, Tailwind, Framer Motion. Admin credentials stored in 1Password under 'Aether Admin'. Features: multi-vendor ready, i18n, dark mode.",
    featured: true,
    createdAt: "2025-11-12",
    updatedAt: "2026-07-20",
  },
  {
    id: "2",
    title: "Nova Analytics Dashboard",
    description:
      "Real-time analytics and business intelligence dashboard with beautiful charts and customizable widgets.",
    longDescription:
      "Connect your data sources and get instant insights. Role-based access, export to PDF/CSV, scheduled reports, and dark/light themes.",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    liveUrl: "https://example-nova.com",
    isForSale: true,
    oldPrice: 950,
    newPrice: 699,
    tags: ["React", "Dashboard", "Charts"],
    privateNotes:
      "Hosted on Railway. Stack: React + Vite, Recharts, Supabase. Languages: TypeScript. Features: live WebSocket updates, custom SQL queries, white-label option.",
    featured: true,
    createdAt: "2025-09-03",
    updatedAt: "2026-06-15",
  },
  {
    id: "3",
    title: "Lumina Portfolio Template",
    description:
      "A stunning, animated portfolio template for creatives and agencies. Fully responsive with CMS integration.",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    liveUrl: "https://example-lumina.com",
    isForSale: false,
    tags: ["Next.js", "Portfolio", "CMS"],
    privateNotes:
      "Deployed via Netlify. Stack: Next.js, Sanity CMS, GSAP + Framer Motion. Admin: Sanity studio credentials in Bitwarden.",
    featured: false,
    createdAt: "2025-06-18",
    updatedAt: "2026-04-02",
  },
  {
    id: "4",
    title: "Pulse SaaS Starter",
    description:
      "Complete SaaS boilerplate with auth, billing, teams, and beautiful UI. Launch your product faster.",
    longDescription:
      "Includes magic-link + OAuth auth, subscription management, team workspaces, usage metering, and a polished marketing site.",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    liveUrl: "https://example-pulse.com",
    demoUrl: "https://example-pulse.com/demo",
    isForSale: true,
    oldPrice: 1499,
    newPrice: 999,
    tags: ["SaaS", "Next.js", "Auth"],
    privateNotes:
      "Vercel + Supabase. Stack: Next.js App Router, NextAuth, Stripe, Tailwind, shadcn/ui. Features: multi-tenancy, webhook handling, email templates with Resend.",
    featured: true,
    createdAt: "2026-01-22",
    updatedAt: "2026-07-28",
  },
  {
    id: "5",
    title: "Echo Chat Platform",
    description:
      "Real-time messaging platform with channels, DMs, file sharing and voice notes. Built for communities.",
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
    liveUrl: "https://example-echo.com",
    isForSale: false,
    tags: ["Realtime", "Chat", "WebSockets"],
    privateNotes:
      "Deployed on Fly.io. Stack: Next.js, Socket.io, Redis, MongoDB. Languages: TypeScript. Features: end-to-end encryption option, presence indicators, message reactions.",
    featured: false,
    createdAt: "2025-12-05",
    updatedAt: "2026-05-10",
  },
  {
    id: "6",
    title: "Forge Learning LMS",
    description:
      "Modern Learning Management System with courses, quizzes, certificates and student progress tracking.",
    thumbnail: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80",
    liveUrl: "https://example-forge.com",
    isForSale: true,
    oldPrice: 1800,
    newPrice: 1299,
    tags: ["LMS", "Education", "Next.js"],
    privateNotes:
      "AWS + Vercel. Stack: Next.js, Prisma, PostgreSQL, Mux for video. Admin notes: SSO ready, SCORM support planned, current credentials location: 1Password 'Forge LMS'.",
    featured: false,
    createdAt: "2026-02-14",
    updatedAt: "2026-07-01",
  },
];

// Helper to get only public fields (strip privateNotes)
export function getPublicWebsites(websites: Website[] = mockWebsites) {
  return websites.map(({ privateNotes, ...rest }) => rest);
}

export function getForSaleWebsites(websites: Website[] = mockWebsites) {
  return websites.filter((w) => w.isForSale);
}
