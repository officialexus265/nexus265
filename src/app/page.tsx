import { Hero } from "@/components/Hero";
import { WebsiteGrid } from "@/components/WebsiteGrid";
import { getPublicWebsites } from "@/data/websites";
import Link from "next/link";
import { Briefcase, ArrowRight } from "lucide-react";

export default function HomePage() {
  const websites = getPublicWebsites();

  return (
    <>
      <Hero />

      {/* Websites grid */}
      <section id="websites" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold">
              My Websites
            </h2>
            <p className="mt-2 text-muted max-w-xl">
              A living directory of everything I have built and currently maintain.
              Click through to explore live versions.
            </p>
          </div>
          <Link
            href="/selling"
            className="inline-flex items-center gap-2 text-sm text-accent hover:text-cyan-300 transition-colors"
          >
            Looking for projects for sale?
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <WebsiteGrid websites={websites} emptyMessage="No websites match your search." />
      </section>

      {/* Hire CTA band */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/10 to-cyan-500/20" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold mb-4">
            Need something custom?
          </h2>
          <p className="text-muted text-lg mb-8 max-w-2xl mx-auto">
            From landing pages to full SaaS products — I design, build and ship
            production-ready experiences. Let’s talk about your next project.
          </p>
          <Link href="/contact#hire" className="btn-accent text-base py-3.5 px-8 inline-flex">
            <Briefcase className="w-5 h-5" />
            Hire Me
          </Link>
        </div>
      </section>
    </>
  );
}
