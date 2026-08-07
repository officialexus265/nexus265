import { WebsiteGrid } from "@/components/WebsiteGrid";
import { getForSaleWebsites } from "@/data/websites";
import Link from "next/link";
import { Briefcase, Tag } from "lucide-react";

export const metadata = {
  title: "Projects for Sale | DevHub",
  description:
    "Ready-to-launch websites and SaaS starters at special prices. View demos and negotiate.",
};

export default function SellingPage() {
  const forSale = getForSaleWebsites();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative hero-pattern border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-sm text-cyan-300 mb-5">
              <Tag className="w-4 h-4" />
              Limited-time discounted prices
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold leading-tight">
              Projects <span className="gradient-text">for Sale</span>
            </h1>
            <p className="mt-4 text-lg text-muted leading-relaxed">
              Production-ready websites and starters. Each comes with clean code,
              documentation notes, and the option to negotiate. Click “View Demo”
              to experience them live, then talk to me to close the deal.
            </p>
          </div>
        </div>
      </section>

      {/* Grid + Search */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <WebsiteGrid
          websites={forSale}
          showPrice
          fetchFromApi
          forSaleOnly
          emptyMessage="No projects match your search. Check back soon or hire me for a custom build."
        />
      </section>

      {/* Negotiation note */}
      <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <div className="glass rounded-2xl p-8 border border-border">
          <h3 className="font-semibold text-xl mb-3">How purchasing works</h3>
          <p className="text-muted text-sm leading-relaxed mb-6">
            Prices shown are starting points. Click <strong>Talk to Developer</strong> on any
            card to open a conversation (WhatsApp / email / form). We can discuss scope,
            customizations, source-code transfer, and final price. When you’re ready,
            payment can be completed via <strong>Paychangu</strong> or other agreed methods.
          </p>
          <Link href="/contact#hire" className="btn-accent inline-flex">
            <Briefcase className="w-4 h-4" />
            Or just Hire Me for a custom project
          </Link>
        </div>
      </section>
    </div>
  );
}
