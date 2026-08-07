"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MessageCircle,
  Send,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

function ContactForm() {
  const searchParams = useSearchParams();
  const project = searchParams.get("project") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: project ? `Inquiry about: ${project}` : "",
    message: project
      ? `Hi, I'm interested in the project "${project}". Let's discuss details and pricing.`
      : "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (project) {
      setForm((prev) => ({
        ...prev,
        subject: `Inquiry about: ${project}`,
        message: `Hi, I'm interested in the project "${project}". Let's discuss details and pricing.`,
      }));
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    // Simulate send – replace with real API / Resend / Formspree later
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("sent");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">
            Name
          </label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">
            Email
          </label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            placeholder="you@email.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-1.5">
          Subject
        </label>
        <input
          required
          type="text"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
          placeholder="What's this about?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-1.5">
          Message
        </label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none"
          placeholder="Tell me about your project or question..."
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending" || status === "sent"}
        className="btn-primary w-full sm:w-auto justify-center disabled:opacity-60"
      >
        {status === "sending" ? (
          "Sending..."
        ) : status === "sent" ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Message Sent
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send Message
          </>
        )}
      </button>

      {status === "sent" && (
        <p className="text-sm text-success">
          Thanks! I’ll get back to you as soon as possible.
        </p>
      )}
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative hero-pattern border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold">
              Let’s{" "}
              <span className="gradient-text">connect</span>
            </h1>
            <p className="mt-4 text-lg text-muted">
              Whether you want to buy a project, hire me, or just say hello —
              I’m one message away.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Quick contact methods */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-semibold text-xl mb-2">Reach me directly</h2>

            <a
              href="mailto:you@example.com"
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-110 transition">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted">you@example.com</p>
              </div>
            </a>

            <a
              href="https://wa.me/1234567890?text=Hi%2C%20I%20found%20your%20DevHub%20and%20would%20like%20to%20talk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-green-500/40 transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-muted">Chat instantly</p>
              </div>
            </a>

            <a
              href="tel:+1234567890"
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-blue-500/40 transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium">Call</p>
                <p className="text-sm text-muted">+1 234 567 890</p>
              </div>
            </a>

            {/* Hire CTA */}
            <div
              id="hire"
              className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-cyan-500/10 border border-primary/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <Briefcase className="w-6 h-6 text-accent" />
                <h3 className="font-semibold text-lg">Hire Me</h3>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Looking for a full custom build, redesign, or ongoing development?
                Use the form or any of the channels above and mention “Hire Me”
                so I can prioritize your request.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="glass rounded-2xl p-6 md:p-8 border border-border">
              <h2 className="font-semibold text-xl mb-6">Send a message</h2>
              <Suspense fallback={<div className="text-muted">Loading form...</div>}>
                <ContactForm />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
