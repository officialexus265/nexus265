import Link from "next/link";
import { Briefcase, Mail, Phone, MessageCircle } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white text-lg">
                D
              </div>
              <span className="font-[family-name:var(--font-display)] font-semibold text-lg">
                Dev<span className="gradient-text">Hub</span>
              </span>
            </Link>
            <p className="text-muted text-sm max-w-md leading-relaxed">
              A curated collection of my websites, ready-to-launch projects, and a private
              command center for managing everything. Built with modern tools and a passion
              for clean experiences.
            </p>
            <Link
              href="/contact#hire"
              className="inline-flex items-center gap-2 mt-5 btn-accent text-sm py-2.5 px-5"
            >
              <Briefcase className="w-4 h-4" />
              Hire Me
            </Link>
          </div>

          {/* Quick links */}
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

          {/* Contact quick */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted mb-4">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:you@example.com"
                  className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  you@example.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/1234567890"
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
                  href="tel:+1234567890"
                  className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  +1 234 567 890
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>© {year} DevHub. All rights reserved.</p>
          <p>
            Built with Next.js · Hosted on Vercel · Designed for clarity
          </p>
        </div>
      </div>
    </footer>
  );
}
