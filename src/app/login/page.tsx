"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simple client-side check for demo.
    // In production replace with NextAuth Credentials + env vars.
    // Example: ADMIN_EMAIL=you@example.com  ADMIN_PASSWORD=your-secure-pass
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@devhub.com";
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "devhub2026";

    await new Promise((r) => setTimeout(r, 800));

    if (email === adminEmail && password === adminPass) {
      // Set a simple session flag (replace with real auth cookie/JWT)
      if (typeof window !== "undefined") {
        localStorage.setItem("devhub_auth", "true");
        localStorage.setItem("devhub_user", email);
      }
      router.push("/admin");
    } else {
      setError("Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 hero-pattern pointer-events-none" />
      <motion.div
        className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-cyan-400/15 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8 md:p-10 border border-border shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 mb-4 shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold">
              Admin Access
            </h1>
            <p className="mt-2 text-sm text-muted">
              Only the owner can sign in. Manage websites, private notes & more.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  placeholder="admin@devhub.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                >
                  {showPass ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-60"
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Demo credentials:{" "}
            <code className="text-accent">admin@devhub.com</code> /{" "}
            <code className="text-accent">devhub2026</code>
          </p>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-muted hover:text-accent transition-colors"
            >
              ← Back to public site
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
