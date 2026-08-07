"use client";

import Link from "next/link";
import Image from "next/image";
import { Briefcase, Mail, Phone, MessageCircle } from "lucide-react";
import { useSettings } from "@/lib/settings";

export function Footer() {
  const year = new Date().getFullYear();
  const { settings } = useSettings();
  const name = settings.siteName || "nexus265";
  const wa = settings.whatsapp.replace(/\D/g, "");

  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              {settings.logo ? (
                <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white/5">
                  <Image src={settings.logo} alt={name} fill className="object-contain" unoptimized />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-[family-name:var(--font-display)] font-semibold text-lg">
                {name}
              </span>
            </Link>
            <p className="text-muted text-sm max-w-md leading-relaxed">
              {settings.tagline || "where ideas connect."}
            </p>
            <Link
              href="/contact#hire"
              className="inline-flex items-center gap-2 mt-5 btn-accent text-sm py-2.5 px-5"
            >
              <Briefcase className="w-4 h-4" />
              Hire Me
            </Link>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted mb-4">
              Navigate
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-foreground/80 hover:text-accent transition-colors">
                  All Websites
                </Link>
              </li>
              <li>
                <Link href="/selling" className="text-foreground/80 hover:text-accent transition-colors">
                  Projects for Sale
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-foreground/80 hover:text-accent transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-foreground/80 hover:text-accent transition-colors">
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted mb-4">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {settings.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`tel:${settings.phone}`}
                  className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {settings.phone}
                </a>
              </li>
            </ul>

            {/* Social links */}
            {(settings.social.facebook ||
              settings.social.x ||
              settings.social.linkedin ||
              settings.social.tiktok) && (
              <div className="flex flex-wrap gap-3 mt-5">
                {settings.social.facebook && (
                  <a
                    href={settings.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted hover:text-accent"
                  >
                    Facebook
                  </a>
                )}
                {settings.social.x && (
                  <a
                    href={settings.social.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted hover:text-accent"
                  >
                    X
                  </a>
                )}
                {settings.social.linkedin && (
                  <a
                    href={settings.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted hover:text-accent"
                  >
                    LinkedIn
                  </a>
                )}
                {settings.social.tiktok && (
                  <a
                    href={settings.social.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted hover:text-accent"
                  >
                    TikTok
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>
            © {year} {name}. All rights reserved.
          </p>
          <p>Built with Next.js · Hosted on Vercel</p>
        </div>
      </div>
    </footer>
  );
}
