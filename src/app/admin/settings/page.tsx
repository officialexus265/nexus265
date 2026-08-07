"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Lock,
  Save,
  Mail,
  Phone,
  MessageCircle,
  User,
  Upload,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { useSettings, fileToDataUrl } from "@/lib/settings";
import { SiteSettings, defaultSettings } from "@/types";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [saved, setSaved] = useState(false);
  const { settings, update } = useSettings();
  const [form, setForm] = useState<SiteSettings>(defaultSettings);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const auth = localStorage.getItem("devhub_auth");
    if (auth !== "true") {
      router.replace("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = () => {
    update(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logo" | "heroImage"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Please upload PNG, JPG, JPEG, GIF or WebP");
      return;
    }
    // Limit ~2MB for localStorage safety
    if (file.size > 2 * 1024 * 1024) {
      alert("Image should be under 2MB for now. Compress it or use a URL.");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setForm((prev) => ({ ...prev, [field]: dataUrl }));
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
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
              Branding, contact & social — updates sitewide
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Branding */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            Branding
          </h2>

          <div>
            <label className="block text-sm text-muted mb-1.5">Site name</label>
            <input
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
              placeholder="nexus265"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Tagline</label>
            <input
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
              placeholder="where ideas connect."
            />
          </div>

          {/* Logo upload */}
          <div>
            <label className="block text-sm text-muted mb-1.5">Logo (PNG, JPG, GIF, WebP)</label>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-background border border-border flex items-center justify-center">
                {form.logo ? (
                  <Image src={form.logo} alt="Logo" fill className="object-contain" unoptimized />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted" />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="btn-outline text-sm py-2 px-3"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
                {form.logo && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logo: "" })}
                    className="btn-outline text-sm py-2 px-3 text-red-400 border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e, "logo")}
              />
            </div>
            <p className="text-xs text-muted mt-2">Used in navbar & footer sitewide.</p>
          </div>

          {/* Hero image upload */}
          <div>
            <label className="block text-sm text-muted mb-1.5">
              Hero background image (PNG, JPG, GIF, WebP)
            </label>
            <div className="space-y-3">
              {form.heroImage ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-background border border-border">
                  <Image
                    src={form.heroImage}
                    alt="Hero"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-full h-36 rounded-xl bg-background border border-dashed border-border flex items-center justify-center text-muted text-sm">
                  No hero image (gradient placeholder will show)
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => heroInputRef.current?.click()}
                  className="btn-outline text-sm py-2 px-3"
                >
                  <Upload className="w-4 h-4" />
                  Upload hero image
                </button>
                {form.heroImage && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, heroImage: "" })}
                    className="btn-outline text-sm py-2 px-3 text-red-400 border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={heroInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e, "heroImage")}
              />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-lg">Contact details</h2>

          <div>
            <label className="block text-sm text-muted mb-1.5 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Phone
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp (digits with country code)
            </label>
            <input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
              placeholder="265999939040"
            />
          </div>
        </section>

        {/* Social */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-lg">Social links</h2>
          <p className="text-sm text-muted -mt-2">Leave blank to hide.</p>

          {(
            [
              ["facebook", "Facebook URL"],
              ["x", "X (Twitter) URL"],
              ["linkedin", "LinkedIn URL"],
              ["tiktok", "TikTok URL"],
              ["gmail", "Gmail / mailto link"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm text-muted mb-1.5">{label}</label>
              <input
                value={form.social[key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    social: { ...form.social, [key]: e.target.value },
                  })
                }
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                placeholder="https://..."
              />
            </div>
          ))}
        </section>

        {/* Security note */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-accent" />
            Security
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Login credentials are set via environment variables
            <code className="mx-1 text-accent">NEXT_PUBLIC_ADMIN_EMAIL</code> and
            <code className="mx-1 text-accent">NEXT_PUBLIC_ADMIN_PASSWORD</code>.
            Change them in Vercel → Project → Settings → Environment Variables.
          </p>
        </section>

        <div className="flex items-center gap-4 pb-10">
          <button onClick={handleSave} className="btn-primary">
            <Save className="w-4 h-4" />
            Save settings
          </button>
          {saved && (
            <span className="text-sm text-success">Saved — site updated</span>
          )}
        </div>
      </div>
    </div>
  );
}
