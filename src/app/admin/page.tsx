"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Save,
  X,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Settings,
} from "lucide-react";
import { mockWebsites } from "@/data/websites";
import { Website } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { uploadImage } from "@/lib/upload";

const emptyForm: Omit<Website, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  description: "",
  longDescription: "",
  thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  liveUrl: "",
  demoUrl: "",
  isForSale: false,
  oldPrice: undefined,
  newPrice: undefined,
  tags: [],
  privateNotes: "",
  featured: false,
};

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [editing, setEditing] = useState<Website | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showPrivate, setShowPrivate] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const filteredWebsites = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return websites;
    return websites.filter((site) => {
      const haystack = [
        site.title,
        site.description,
        site.privateNotes || "",
        ...(site.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [websites, search]);

  useEffect(() => {
    const auth = localStorage.getItem("devhub_auth");
    // Also allow NextAuth cookie session — page will still work after login
    async function load() {
      try {
        const res = await fetch("/api/websites");
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setWebsites(data);
          setAuthorized(true);
          return;
        }
      } catch {}
      // Fallback local
      if (auth !== "true") {
        router.replace("/login");
        return;
      }
      setAuthorized(true);
      const stored = localStorage.getItem("devhub_websites");
      if (stored) {
        try {
          setWebsites(JSON.parse(stored));
        } catch {
          setWebsites(mockWebsites);
        }
      } else {
        setWebsites(mockWebsites);
      }
    }
    load();
  }, [router]);

  const persist = (list: Website[]) => {
    setWebsites(list);
    localStorage.setItem("devhub_websites", JSON.stringify(list));
  };

  const apiCreate = async (data: Omit<Website, "id" | "createdAt" | "updatedAt">) => {
    const res = await fetch("/api/websites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) return res.json();
    return null;
  };

  const apiUpdate = async (id: string, data: Partial<Website>) => {
    const res = await fetch(`/api/websites/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) return res.json();
    return null;
  };

  const apiDelete = async (id: string) => {
    const res = await fetch(`/api/websites/${id}`, { method: "DELETE" });
    return res.ok;
  };

  const openNew = () => {
    setIsNew(true);
    setEditing(null);
    setForm(emptyForm);
    setTagInput("");
  };

  const openEdit = (site: Website) => {
    setIsNew(false);
    setEditing(site);
    setForm({
      title: site.title,
      description: site.description,
      longDescription: site.longDescription || "",
      thumbnail: site.thumbnail,
      liveUrl: site.liveUrl,
      demoUrl: site.demoUrl || "",
      isForSale: site.isForSale,
      oldPrice: site.oldPrice,
      newPrice: site.newPrice,
      tags: site.tags || [],
      privateNotes: site.privateNotes || "",
      featured: site.featured || false,
    });
    setTagInput((site.tags || []).join(", "));
  };

  const closeModal = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const now = new Date().toISOString().slice(0, 10);
    const payload = { ...form, tags };

    if (isNew) {
      const created = await apiCreate(payload);
      if (created) {
        persist([created, ...websites]);
      } else {
        const newSite: Website = {
          ...form,
          tags,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        persist([newSite, ...websites]);
      }
    } else if (editing) {
      const updatedRow = await apiUpdate(editing.id, payload);
      if (updatedRow) {
        persist(websites.map((w) => (w.id === editing.id ? updatedRow : w)));
      } else {
        persist(
          websites.map((w) =>
            w.id === editing.id ? { ...w, ...form, tags, updatedAt: now } : w
          )
        );
      }
    }

    setSaving(false);
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this website entry permanently?")) return;
    await apiDelete(id);
    persist(websites.filter((w) => w.id !== id));
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
      {/* Admin toolbar */}
      <div className="border-b border-border bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-accent" />
              Dashboard
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Manage listings & private notes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/settings" className="btn-outline text-sm py-2 px-4">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button onClick={openNew} className="btn-primary text-sm py-2 px-4">
              <Plus className="w-4 h-4" />
              Add Website
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Sites", value: websites.length },
            { label: "For Sale", value: websites.filter((w) => w.isForSale).length },
            { label: "Featured", value: websites.filter((w) => w.featured).length },
            { label: "With Private Notes", value: websites.filter((w) => w.privateNotes).length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-4"
            >
              <p className="text-2xl font-bold text-accent">{stat.value}</p>
              <p className="text-xs text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by title, description, tags or notes..."
            className="max-w-lg"
          />
          {search && (
            <p className="text-sm text-muted">
              {filteredWebsites.length} result{filteredWebsites.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Table / list */}
        <div className="space-y-4">
          {filteredWebsites.length === 0 && (
            <p className="text-center text-muted py-12">No websites match your search.</p>
          )}
          {filteredWebsites.map((site) => (
            <motion.div
              key={site.id}
              layout
              className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center"
            >
              <div className="relative w-full md:w-28 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-border">
                <Image
                  src={site.thumbnail}
                  alt={site.title}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{site.title}</h3>
                  {site.featured && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-indigo-300">
                      Featured
                    </span>
                  )}
                  {site.isForSale && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-cyan-300">
                      For Sale
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted line-clamp-1">{site.description}</p>
                {site.privateNotes && (
                  <p className="text-xs text-warning/80 mt-1 line-clamp-1">
                    🔒 {site.privateNotes.slice(0, 80)}…
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={site.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-white"
                  title="Visit"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => openEdit(site)}
                  className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-accent"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(site.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Edit / New Modal */}
      <AnimatePresence>
        {(editing || isNew) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/70 backdrop-blur-sm overflow-y-auto"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl my-8"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="font-semibold text-lg">
                  {isNew ? "Add New Website" : "Edit Website"}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-white/5 text-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Public fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-muted mb-1">Title *</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-background border border-border outline-none focus:border-primary"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm text-muted mb-1">Short Description *</label>
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-background border border-border outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm text-muted mb-1">Long Description</label>
                    <textarea
                      rows={3}
                      value={form.longDescription}
                      onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-background border border-border outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted mb-1">Live URL *</label>
                    <input
                      value={form.liveUrl}
                      onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-background border border-border outline-none focus:border-primary"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted mb-1">Demo URL</label>
                    <input
                      value={form.demoUrl}
                      onChange={(e) => setForm({ ...form, demoUrl: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-background border border-border outline-none focus:border-primary"
                      placeholder="https://.../demo"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm text-muted mb-1">
                      Thumbnail (upload or paste URL)
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={form.thumbnail}
                        onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                        className="flex-1 px-3 py-2.5 rounded-lg bg-background border border-border outline-none focus:border-primary"
                        placeholder="https://... or upload →"
                      />
                      <label className="btn-outline text-sm py-2 px-3 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const { url } = await uploadImage(file, "nexus265/thumbnails");
                            setForm((prev) => ({ ...prev, thumbnail: url }));
                          }}
                        />
                      </label>
                    </div>
                    {form.thumbnail && (
                      <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden bg-border">
                        <Image
                          src={form.thumbnail}
                          alt="Preview"
                          fill
                          className="object-cover"
                          sizes="600px"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-muted mb-1">Tags (comma separated)</label>
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-background border border-border outline-none focus:border-primary"
                      placeholder="Next.js, SaaS, Dashboard"
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-6">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isForSale}
                        onChange={(e) => setForm({ ...form, isForSale: e.target.checked })}
                        className="rounded border-border"
                      />
                      For Sale
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                        className="rounded border-border"
                      />
                      Featured
                    </label>
                  </div>

                  {form.isForSale && (
                    <>
                      <div>
                        <label className="block text-sm text-muted mb-1">Old Price (strikethrough)</label>
                        <input
                          type="number"
                          value={form.oldPrice ?? ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              oldPrice: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-lg bg-background border border-border outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted mb-1">New Price</label>
                        <input
                          type="number"
                          value={form.newPrice ?? ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              newPrice: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-lg bg-background border border-border outline-none focus:border-primary"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Private section */}
                <div className="pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowPrivate(!showPrivate)}
                    className="flex items-center gap-2 text-sm font-medium text-warning mb-3"
                  >
                    {showPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    Private Blueprint / Notes (not shown publicly)
                  </button>

                  {showPrivate && (
                    <div>
                      <label className="block text-sm text-muted mb-1">
                        Deployment, languages, features, credentials location, etc.
                      </label>
                      <textarea
                        rows={5}
                        value={form.privateNotes}
                        onChange={(e) => setForm({ ...form, privateNotes: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg bg-background border border-warning/30 outline-none focus:border-warning resize-none text-sm"
                        placeholder="Deployed on Vercel. Stack: Next.js + Prisma... Credentials stored in 1Password under 'Project X'. Features: auth, payments, admin..."
                      />
                      <p className="text-xs text-muted mt-1">
                        Never store actual passwords here. Reference your password manager instead.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 p-5 border-t border-border">
                <button onClick={closeModal} className="btn-outline text-sm py-2 px-4">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title || !form.liveUrl}
                  className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
