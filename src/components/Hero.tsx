"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Sparkles } from "lucide-react";
import { useSettings } from "@/lib/settings";

export function Hero() {
  const { settings } = useSettings();
  const name = settings.siteName || "nexus265";

  return (
    <section className="relative overflow-hidden hero-pattern min-h-[75vh] flex items-center">
      {/* Background image — full bleed, right side stays visible */}
      {settings.heroImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={settings.heroImage}
            alt=""
            fill
            className="object-cover object-right"
            unoptimized
            priority
          />
          {/* Stronger fade on the LEFT so text stays readable; right stays clearer for the image */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80" />
        </div>
      )}

      {/* Soft orbs — only on the left so they don't cover the image area */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content — locked to the left half */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="max-w-xl lg:max-w-2xl text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-indigo-300 mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Portfolio · Marketplace · Command Center
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.15] tracking-tight text-left"
          >
            <span className="text-white">{name}.</span>{" "}
            <span className="gradient-text">
              {settings.tagline || "where ideas connect."}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-base md:text-lg text-muted max-w-lg leading-relaxed text-left"
          >
            Explore live projects, grab ready-to-launch websites at discounted prices,
            or hire me to build something exceptional for you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-wrap gap-3 justify-start"
          >
            <Link href="#websites" className="btn-primary text-sm sm:text-base py-3 px-5">
              Browse Websites
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/selling" className="btn-outline text-sm sm:text-base py-3 px-5">
              View Projects for Sale
            </Link>
            <Link href="/contact#hire" className="btn-accent text-sm sm:text-base py-3 px-5">
              <Briefcase className="w-5 h-5" />
              Hire Me
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
