"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  Save,
  Mail,
  Phone,
  MessageCircle,
  User,
} from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [saved, setSaved] = useState(false);

  // Contact info (stored in localStorage for demo)
  const [email, setEmail] = useState("you@example.com");
  const [phone, setPhone] = useState("+1 234 567 890");
  const [whatsapp, setWhatsapp] = useState("1234567890");
  const [displayName, setDisplayName] = useState("DevHub");

  useEffect(() => {
    const auth = localStorage.getItem("devhub_auth");
    if (auth !== "true") {
      router.replace("/login");
      return;
    }
    setAuthorized(true);

    const stored = localStorage.getItem("devhub_settings");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);
        if (data.whatsapp) setWhatsapp(data.whatsapp);
        if (data.displayName) setDisplayName(data.displayName);
      } catch {
        /* ignore */
      }
    }
  }, [router]);

  const handleSave = () => {
    localStorage.setItem(
      "devhub_settings",
      JSON.stringify({ email, phone, whatsapp, displayName })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Checking authorization...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent" />
                Settings
              </h1>
              <p className="text-xs text-muted mt-0.5">
                Contact details & profile (demo storage)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Profile */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            Profile
          </h2>
          <div>
            <label className="block text-sm text-muted mb-1.5">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
            />
          </div>
        </section>

        {/* Contact */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-lg">Public contact details</h2>
          <p className="text-sm text-muted -mt-2">
            These are currently placeholders. After saving here, you still need to
            update the Contact page & Footer code (or we can wire them automatically later).
          </p>

          <div>
            <label className="block text-sm text-muted mb-1.5 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Phone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp number (digits only)
            </label>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
              placeholder="1234567890"
            />
          </div>
        </section>

        {/* Security note */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-accent" />
            Security
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Login credentials are currently set via environment variables
            (<code className="mx-1 text-accent">NEXT_PUBLIC_ADMIN_EMAIL</code> and
            <code className="mx-1 text-accent">NEXT_PUBLIC_ADMIN_PASSWORD</code>.
            Change them in your Vercel project settings or <code className="text-accent">.env.local</code>.
            A full password-change form will be added when we move to proper NextAuth.
          </p>
        </section>

        <div className="flex items-center gap-4">
          <button onClick={handleSave} className="btn-primary">
            <Save className="w-4 h-4" />
            Save settings
          </button>
          {saved && (
            <span className="text-sm text-success">Saved successfully</span>
          )}
        </div>
      </div>
    </div>
  );
}
