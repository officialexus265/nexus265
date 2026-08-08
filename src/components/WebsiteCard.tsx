"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, Play, Briefcase, Tag } from "lucide-react";
import { Website } from "@/types";
import { formatPrice } from "@/lib/utils";

interface WebsiteCardProps {
  site: Website;
  index?: number;
  showPrice?: boolean;
}

export function WebsiteCard({ site, index = 0, showPrice = false }: WebsiteCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden card-lift"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-border">
        <Image
          src={site.thumbnail}
          alt={site.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Featured badge */}
        {site.featured && (
          <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/90 text-white backdrop-blur-sm">
            Featured
          </span>
        )}

        {/* For sale badge */}
        {site.isForSale && (
          <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full bg-accent/90 text-background backdrop-blur-sm">
            For Sale
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-[family-name:var(--font-display)] font-semibold text-lg leading-tight group-hover:text-accent transition-colors">
            {site.title}
          </h3>
        </div>

        <p className="text-muted text-sm line-clamp-2 leading-relaxed">
          {site.description}
        </p>

        {/* Tags */}
        {site.tags && site.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {site.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-white/5 text-muted border border-white/5"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price (for selling page) */}
        {showPrice && site.isForSale && site.newPrice && (
          <div className="flex items-baseline gap-2 pt-1">
            {site.oldPrice && (
              <span className="price-old text-sm">
                {formatPrice(site.oldPrice)}
              </span>
            )}
            <span className="text-xl font-bold text-accent">
              {formatPrice(site.newPrice)}
            </span>
          </div>
        )}

        {/* Actions — clean 2-row grid */}
        <div className="pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <a
              href={site.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs py-2.5 px-3 justify-center w-full"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Visit Site
            </a>
            {site.demoUrl ? (
              <a
                href={site.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-xs py-2.5 px-3 justify-center w-full"
              >
                <Play className="w-3.5 h-3.5" />
                View Demo
              </a>
            ) : site.isForSale ? (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("nexus265-open-chat"))}
                className="btn-outline text-xs py-2.5 px-3 justify-center w-full"
              >
                Talk to Developer
              </button>
            ) : (
              <Link
                href="/contact#hire"
                className="btn-outline text-xs py-2.5 px-3 justify-center w-full"
              >
                <Briefcase className="w-3.5 h-3.5" />
                Hire Me
              </Link>
            )}
          </div>
          {(site.demoUrl || site.isForSale) && (
            <div className="grid grid-cols-2 gap-2">
              {site.demoUrl && site.isForSale && (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("nexus265-open-chat"))}
                  className="btn-outline text-xs py-2.5 px-3 justify-center w-full"
                >
                  Talk to Developer
                </button>
              )}
              <Link
                href="/contact#hire"
                className={`btn-outline text-xs py-2.5 px-3 justify-center w-full border-transparent hover:border-primary/40 ${
                  site.demoUrl && site.isForSale ? "" : "col-span-2"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Hire Me
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
