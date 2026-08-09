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
  LayoutGrid,
  Images,
  Bot,
  Share2,
  Shield,
} from "lucide-react";
import { useSettings } from "@/lib/settings";
import { uploadImage } from "@/lib/upload";
import { SiteSettings, defaultSettings, HeroSlide, defaultSlide1, defaultSlide2, defaultSlide3 } from "@/types";


function AccountForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword: newPassword || undefined,
          newEmail: newEmail || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed");
      } else {
        setMsg(
          [
            data.passwordChanged ? "Password updated." : "",
            data.emailChanged ? "Email updated — sign in again with the new email." : "",
          ]
            .filter(Boolean)
            .join(" ") || "Saved."
        );
        setCurrentPassword("");
        setNewPassword("");
        setNewEmail("");
      }
    } catch {
      setErr("Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm text-muted mb-1.5">Current password</label>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-muted mb-1.5">New email (optional)</label>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
          placeholder="Leave blank to keep current"
        />
      </div>
      <div>
        <label className="block text-sm text-muted mb-1.5">New password (optional)</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
          placeholder="Min 8 characters"
        />
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      {msg && <p className="text-sm text-success">{msg}</p>}
      <button type="submit" disabled={loading} className="btn-outline text-sm py-2 px-4 disabled:opacity-50">
        {loading ? "Updating..." : "Update credentials"}
      </button>
    </form>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [saved, setSaved] = useState(false);
  const { settings, update } = useSettings();
  const [form, setForm] = useState<SiteSettings>(defaultSettings);
  const [settingsTab, setSettingsTab] = useState<
    "branding" | "hero" | "agent" | "contact" | "account"
  >("branding");
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
    setForm({ ...defaultSettings, ...settings });
  }, [settings]);

  const handleSave = () => {
    update(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const [uploading, setUploading] = useState(false);

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logo" | "heroImage" | "favicon"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMimes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
      "image/x-icon",
      "image/vnd.microsoft.icon",
      "image/svg+xml",
      "application/octet-stream", // some browsers send this for .ico
    ];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExt = ["png", "jpg", "jpeg", "gif", "webp", "ico", "svg"];
    const mimeOk = !file.type || allowedMimes.includes(file.type);
    const extOk = allowedExt.includes(ext);
    if (!mimeOk && !extOk) {
      alert("Please upload PNG, JPG, GIF, WebP, SVG or ICO");
      return;
    }
    if (field === "favicon" && !["png", "jpg", "jpeg", "ico", "svg", "webp"].includes(ext) && file.type && !allowedMimes.includes(file.type)) {
      alert("Favicon: use PNG, ICO, SVG or WebP");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("Image should be under 8MB.");
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadImage(file, `nexus265/${field}`);
      setForm((prev) => ({ ...prev, [field]: url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed. Is Cloudinary configured?");
    } finally {
      setUploading(false);
    }
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

      <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28">
        <div className="flex flex-wrap gap-1 p-1 mb-6 rounded-2xl bg-card border border-border">
          {(
            [
              ["branding", "Branding", LayoutGrid],
              ["hero", "Hero slider", Images],
              ["agent", "Chat agent", Bot],
              ["contact", "Contact & social", Share2],
              ["account", "Account", Shield],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSettingsTab(id)}
              className={`flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2.5 rounded-xl transition flex-1 justify-center min-w-[100px] ${
                settingsTab === id
                  ? "bg-primary text-white shadow"
                  : "text-muted hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-6">
        {settingsTab === "branding" && (
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
                  disabled={uploading}
                  className="btn-outline text-sm py-2 px-3 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload"}
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
                  disabled={uploading}
                  className="btn-outline text-sm py-2 px-3 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload hero image"}
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

          {/* Favicon */}
          <div>
            <label className="block text-sm text-muted mb-1.5">Favicon (PNG, ICO, SVG recommended square)</label>
            <div className="flex items-center gap-4">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-background border border-border flex items-center justify-center">
                {form.favicon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.favicon} alt="Favicon" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-muted">ico</span>
                )}
              </div>
              <div className="flex gap-2">
                <label className="btn-outline text-sm py-2 px-3 cursor-pointer">
                  <Upload className="w-4 h-4 inline mr-1" />
                  Upload favicon
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/x-icon,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => handleFile(e, "favicon")}
                  />
                </label>
                {form.favicon && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, favicon: "" })}
                    className="btn-outline text-sm py-2 px-3 text-red-400 border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
        )}

        {settingsTab === "hero" && (
        <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="font-semibold text-lg">Hero slider (3 slides)</h2>
              <p className="text-sm text-muted mt-1">
                Slide 1 is your main hero. Slides 2 and 3 are fully customizable.
              </p>
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-xs text-muted mb-1">Slide speed (seconds)</label>
              <input
                type="number"
                min={2}
                max={30}
                step={1}
                value={Math.round((form.slideSpeedMs || 7000) / 1000)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slideSpeedMs: Math.max(2, Number(e.target.value) || 7) * 1000,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          {(form.slides || [defaultSlide1(), defaultSlide2(), defaultSlide3()]).map((slide, idx) => (
            <div key={slide.id || idx} className="border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-accent">Slide {idx + 1}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted mb-1">Badge</label>
                  <input
                    value={slide.badge}
                    onChange={(e) => {
                      const slides = [...(form.slides || [])];
                      slides[idx] = { ...slides[idx], badge: e.target.value };
                      setForm({ ...form, slides });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Title</label>
                  <input
                    value={slide.title}
                    onChange={(e) => {
                      const slides = [...(form.slides || [])];
                      slides[idx] = { ...slides[idx], title: e.target.value };
                      setForm({ ...form, slides });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Highlight (gradient text)</label>
                  <input
                    value={slide.highlight}
                    onChange={(e) => {
                      const slides = [...(form.slides || [])];
                      slides[idx] = { ...slides[idx], highlight: e.target.value };
                      setForm({ ...form, slides });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={slide.description}
                    onChange={(e) => {
                      const slides = [...(form.slides || [])];
                      slides[idx] = { ...slides[idx], description: e.target.value };
                      setForm({ ...form, slides });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary resize-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted mb-1">Background image URL or upload</label>
                  <div className="flex gap-2">
                    <input
                      value={slide.image}
                      onChange={(e) => {
                        const slides = [...(form.slides || [])];
                        slides[idx] = { ...slides[idx], image: e.target.value };
                        setForm({ ...form, slides });
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary"
                      placeholder="https://... or upload"
                    />
                    <label className="btn-outline text-xs py-2 px-3 cursor-pointer shrink-0">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(true);
                          try {
                            const { url } = await uploadImage(file, `nexus265/slide-${idx + 1}`);
                            const slides = [...(form.slides || [])];
                            slides[idx] = { ...slides[idx], image: url };
                            setForm({ ...form, slides });
                          } finally {
                            setUploading(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {slide.image && (
                    <div className="relative mt-2 h-24 rounded-lg overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slide.image} alt="" className="w-full h-full object-cover object-right" />
                    </div>
                  )}
                </div>
                {[0, 1, 2].map((bi) => (
                  <div key={bi} className="sm:col-span-2 grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs text-muted mb-1">Button {bi + 1} label</label>
                      <input
                        value={slide.buttons?.[bi]?.label || ""}
                        onChange={(e) => {
                          const slides = [...(form.slides || [])];
                          const buttons = [...(slides[idx].buttons || [])];
                          while (buttons.length <= bi) {
                            buttons.push({ label: "", href: "#", style: "outline" });
                          }
                          buttons[bi] = { ...buttons[bi], label: e.target.value };
                          slides[idx] = { ...slides[idx], buttons: buttons.filter((b) => b.label) };
                          setForm({ ...form, slides });
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary"
                        placeholder="Leave empty to hide"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Style</label>
                      <select
                        value={slide.buttons?.[bi]?.style || "outline"}
                        onChange={(e) => {
                          const slides = [...(form.slides || [])];
                          const buttons = [...(slides[idx].buttons || [])];
                          if (buttons[bi]) {
                            buttons[bi] = {
                              ...buttons[bi],
                              style: e.target.value as "primary" | "outline" | "accent",
                            };
                            slides[idx] = { ...slides[idx], buttons };
                            setForm({ ...form, slides });
                          }
                        }}
                        className="w-full px-2 py-2 rounded-lg bg-background border border-border text-sm outline-none"
                      >
                        <option value="primary">Primary</option>
                        <option value="outline">Outline</option>
                        <option value="accent">Accent</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs text-muted mb-1">Button {bi + 1} link</label>
                      <input
                        value={slide.buttons?.[bi]?.href || ""}
                        onChange={(e) => {
                          const slides = [...(form.slides || [])];
                          const buttons = [...(slides[idx].buttons || [])];
                          if (buttons[bi]) {
                            buttons[bi] = { ...buttons[bi], href: e.target.value };
                            slides[idx] = { ...slides[idx], buttons };
                            setForm({ ...form, slides });
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary"
                        placeholder="/selling or #websites or /contact#hire"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
        )}

        {settingsTab === "agent" && (
        <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-lg">Chat agent</h2>
            <p className="text-sm text-muted mt-1">
              Configure the default assistant visitors see. Upload both faces so you (or visitors) can switch gender.
            </p>
            <div className="mt-3 text-xs text-muted leading-relaxed space-y-1.5 p-3 rounded-xl bg-background border border-border">
              <p><strong className="text-foreground">Name & default gender</strong> — used in the chat header and avatar.</p>
              <p><strong className="text-foreground">Speak replies aloud</strong> — free browser text-to-speech (no paid API). When on, bot messages are read out in a male/female system voice matching gender.</p>
              <p><strong className="text-foreground">Visitor choice</strong> — if both photos are uploaded, the chat widget can offer Male / Female before starting.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1.5">Female agent name</label>
              <input
                value={form.agentNameFemale || form.agentName || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    agentNameFemale: e.target.value,
                    agentName: form.agentGender === "female" ? e.target.value : form.agentName,
                  })
                }
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                placeholder="e.g. Maya"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">Male agent name</label>
              <input
                value={form.agentNameMale || form.agentName || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    agentNameMale: e.target.value,
                    agentName: form.agentGender === "male" ? e.target.value : form.agentName,
                  })
                }
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                placeholder="e.g. Alex"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-muted mb-1.5">
                Name when talking to developer (neutral)
              </label>
              <input
                value={form.agentNameHuman || "Developer"}
                onChange={(e) => setForm({ ...form, agentNameHuman: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                placeholder="Developer"
              />
              <p className="text-xs text-muted mt-1">
                Shown after the visitor chooses &quot;Talk to a human agent&quot; — not male/female branded.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-muted mb-1.5">Default gender (if visitor doesn&apos;t pick)</label>
              <div className="flex gap-2">
                {(["female", "male"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm({ ...form, agentGender: g })}
                    className={`flex-1 py-3 rounded-xl border text-sm capitalize transition ${
                      form.agentGender === g
                        ? "border-primary bg-primary/20 text-white"
                        : "border-border text-muted hover:text-white"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background border border-border">
            <div>
              <p className="text-sm font-medium">Speak replies aloud</p>
              <p className="text-xs text-muted mt-0.5">
                Free browser voice (no API cost). Uses a male or female system voice matching gender. The visitor&apos;s device reads the bot text — no recording, no paid service.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!form.agentVoiceEnabled}
              onClick={() =>
                setForm({ ...form, agentVoiceEnabled: !form.agentVoiceEnabled })
              }
              className={`relative w-12 h-7 rounded-full transition shrink-0 ${
                form.agentVoiceEnabled ? "bg-primary" : "bg-white/10"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition ${
                  form.agentVoiceEnabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background border border-border">
            <div>
              <p className="text-sm font-medium">Let visitors choose male / female agent</p>
              <p className="text-xs text-muted mt-0.5">
                When both profile photos are uploaded, the chat asks who they want to talk to. Default gender still applies if they skip.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.allowVisitorAgentPick !== false}
              onClick={() =>
                setForm({
                  ...form,
                  allowVisitorAgentPick: form.allowVisitorAgentPick === false,
                })
              }
              className={`relative w-12 h-7 rounded-full transition shrink-0 ${
                form.allowVisitorAgentPick !== false ? "bg-primary" : "bg-white/10"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition ${
                  form.allowVisitorAgentPick !== false ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                {
                  field: "agentAvatarFemale" as const,
                  label: "Female profile photo",
                  g: "female" as const,
                  url: form.agentAvatarFemale || "",
                },
                {
                  field: "agentAvatarMale" as const,
                  label: "Male profile photo",
                  g: "male" as const,
                  url: form.agentAvatarMale || "",
                },
              ]
            ).map(({ field, label, g, url }) => (
              <div key={field}>
                <label className="block text-sm text-muted mb-1.5">{label}</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-background border border-border flex items-center justify-center shrink-0">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-muted">{g === "female" ? "F" : "M"}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="btn-outline text-xs py-2 px-3 cursor-pointer inline-flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(true);
                          try {
                            const { url: uploaded } = await uploadImage(
                              file,
                              `nexus265/agent-${g}`
                            );
                            setForm((prev) => ({ ...prev, [field]: uploaded }));
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "Upload failed");
                          } finally {
                            setUploading(false);
                          }
                        }}
                      />
                    </label>
                    {url && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, [field]: "" })}
                        className="text-xs text-red-400 text-left"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {form.agentGender === g && (
                  <p className="text-[11px] text-accent mt-1">Currently active</p>
                )}
              </div>
            ))}
          </div>
        </section>
        )}

        {settingsTab === "contact" && (
        <>
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
        </>
        )}

        {settingsTab === "account" && (
        <>
        <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-accent" />
            Login credentials
          </h2>
          <p className="text-sm text-muted">
            Change the email/password you use to sign in. Requires your current password.
            (Works when the database is connected — Phase 3.)
          </p>
          <AccountForm />
        </section>

        {/* Security note */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-accent" />
            Env fallback
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Login credentials are set via environment variables
            <code className="mx-1 text-accent">NEXT_PUBLIC_ADMIN_EMAIL</code> and
            <code className="mx-1 text-accent">NEXT_PUBLIC_ADMIN_PASSWORD</code>.
            Change them in Vercel → Project → Settings → Environment Variables.
          </p>
        </section>
        </>
        )}

        {/* Save — always visible */}
        <div className="sticky bottom-4 flex items-center gap-4 p-4 mt-6 rounded-2xl bg-card/95 border border-border backdrop-blur shadow-xl">
          <button onClick={handleSave} className="btn-primary">
            <Save className="w-4 h-4" />
            Save settings
          </button>
          {saved && (
            <span className="text-sm text-success">Saved — site updated</span>
          )}
          <span className="text-xs text-muted ml-auto hidden sm:inline">
            Tab: {settingsTab}
          </span>
        </div>
        </div>
      </div>
    </div>
  );
}
