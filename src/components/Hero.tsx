"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Briefcase, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { HeroSlide, defaultSlide1, defaultSlide2, defaultSlide3 } from "@/types";
import { cn } from "@/lib/utils";

function SlideContent({ slide, active }: { slide: HeroSlide; active: boolean }) {
  return (
    <div className="absolute inset-0">
      {slide.image && (
        <div className="absolute inset-0 z-0">
          <Image
            src={slide.image}
            alt=""
            fill
            className="object-cover object-right"
            unoptimized
            priority={active}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background from-0% via-background/70 via-40% to-transparent to-70%" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/70" />
        </div>
      )}

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32 h-full flex items-center">
        <div className="max-w-xl lg:max-w-2xl text-left">
          {slide.badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-indigo-300 mb-6">
              <Sparkles className="w-4 h-4" />
              {slide.badge}
            </div>
          )}

          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.15] tracking-tight text-left">
            <span className="text-white">{slide.title}</span>{" "}
            <span className="gradient-text">{slide.highlight}</span>
          </h1>

          {slide.description && (
            <p className="mt-6 text-base md:text-lg text-muted max-w-lg leading-relaxed text-left">
              {slide.description}
            </p>
          )}

          {slide.buttons?.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-3 justify-start">
              {slide.buttons.map((btn, i) => {
                const cls =
                  btn.style === "primary"
                    ? "btn-primary"
                    : btn.style === "accent"
                      ? "btn-accent"
                      : "btn-outline";
                return (
                  <Link
                    key={i}
                    href={btn.href || "#"}
                    className={cn(cls, "text-sm sm:text-base py-3 px-5")}
                  >
                    {btn.style === "accent" && <Briefcase className="w-5 h-5" />}
                    {btn.label}
                    {btn.style === "primary" && btn.href?.startsWith("#") && (
                      <ArrowRight className="w-5 h-5" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const { settings } = useSettings();
  const slides: HeroSlide[] =
    settings.slides?.length === 3
      ? settings.slides
      : [defaultSlide1(), defaultSlide2(), defaultSlide3()];

  // Keep slide 1 image in sync with legacy heroImage if needed
  if (!slides[0].image && settings.heroImage) {
    slides[0] = { ...slides[0], image: settings.heroImage };
  }
  if (!slides[0].title && settings.siteName) {
    slides[0] = {
      ...slides[0],
      title: `${settings.siteName}.`,
      highlight: settings.tagline || slides[0].highlight,
    };
  }

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const speed = Math.max(2000, settings.slideSpeedMs || 7000);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, speed);
    return () => clearInterval(t);
  }, [next, paused, speed]);

  return (
    <section
      className="relative overflow-hidden hero-pattern min-h-[75vh] flex items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Soft orb */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="absolute inset-0 z-[2]"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <SlideContent slide={slides[index]} active />
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={prev}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-muted hover:text-white hover:bg-white/10 transition"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "w-8 bg-accent" : "w-2 bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-muted hover:text-white hover:bg-white/10 transition"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
