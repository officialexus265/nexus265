"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Briefcase,
  LogIn,
  Home,
  ShoppingBag,
  Mail,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings";
import Image from "next/image";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/selling", label: "For Sale", icon: ShoppingBag },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const { settings } = useSettings();

  const handleLogout = async () => {
    localStorage.removeItem("devhub_auth");
    setOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  const isAdminPage = pathname.startsWith("/admin");
  const name = settings.siteName || "nexus265";

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          <Link href="/" className="flex items-center gap-2 group">
            {settings.logo ? (
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform bg-white/5">
                <Image
                  src={settings.logo}
                  alt={name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm shadow-lg group-hover:scale-105 transition-transform">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="font-[family-name:var(--font-display)] font-semibold text-lg tracking-tight hidden sm:block">
              {name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "text-white"
                      : "text-muted hover:text-white hover:bg-white/5"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-primary/20 rounded-lg border border-primary/30"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {!isAdminPage && (
              <Link href="/contact#hire" className="btn-accent text-sm py-2 px-4">
                <Briefcase className="w-4 h-4" />
                Hire Me
              </Link>
            )}

            {isLoggedIn ? (
              isAdminPage ? (
                <button onClick={handleLogout} className="btn-outline text-sm py-2 px-4">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              ) : (
                <Link href="/admin" className="btn-outline text-sm py-2 px-4">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              )
            ) : (
              <Link href="/login" className="btn-outline text-sm py-2 px-4">
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-muted hover:text-white hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium",
                    pathname === link.href
                      ? "bg-primary/20 text-white"
                      : "text-muted hover:bg-white/5 hover:text-white"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 flex flex-col gap-2">
                {!isAdminPage && (
                  <Link
                    href="/contact#hire"
                    onClick={() => setOpen(false)}
                    className="btn-accent justify-center text-sm"
                  >
                    <Briefcase className="w-4 h-4" />
                    Hire Me
                  </Link>
                )}
                {isLoggedIn ? (
                  isAdminPage ? (
                    <button
                      onClick={handleLogout}
                      className="btn-outline justify-center text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  ) : (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="btn-outline justify-center text-sm"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  )
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="btn-outline justify-center text-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
