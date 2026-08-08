"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Languages } from "lucide-react";

type Lang = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
};

type FlowNode = {
  id: string;
  title: string;
  body: string;
  isWelcome: boolean;
  options: { id: string; label: string }[];
};

/**
 * Translation workspace:
 * 1) Translate all English messages first (shown as source)
 * 2) Then activate a language and give it a name/code
 * For now English is the source of truth; extra languages store via BotTranslation later.
 */
export default function BotTranslationsPage() {
  const [langs, setLangs] = useState<Lang[]>([]);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/bot/languages")
      .then((r) => r.json())
      .then((d) => setLangs(Array.isArray(d) ? d : []));
    fetch("/api/bot/flow")
      .then((r) => r.json())
      .then((d) => setNodes(d.nodes || []));
  }, []);

  const addLang = async () => {
    setMsg("");
    const res = await fetch("/api/bot/languages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name, isActive: false }),
    });
    if (!res.ok) {
      setMsg("Could not add language (check code is unique, DB connected)");
      return;
    }
    const lang = await res.json();
    setLangs((l) => [...l, lang]);
    setCode("");
    setName("");
    setMsg(
      "Language added (inactive). Translate messages below, then activate it when ready."
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/admin/bot" className="p-2 rounded-lg hover:bg-white/5 text-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-semibold flex items-center gap-2">
              <Languages className="w-5 h-5 text-accent" />
              Bot translations
            </h1>
            <p className="text-xs text-muted">
              English is the source. Add languages after your flow is complete; activate when
              translations are ready.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-sm">Languages</h2>
          <ul className="space-y-2">
            {langs.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2"
              >
                <span>
                  {l.name} <span className="text-muted">({l.code})</span>
                </span>
                <span className="text-xs text-muted">
                  {l.isDefault ? "Default" : l.isActive ? "Active" : "Inactive"}
                </span>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code e.g. ny"
              className="px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name e.g. Chichewa"
              className="px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={addLang}
              disabled={!code || !name}
              className="btn-primary text-sm justify-center disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add language
            </button>
          </div>
          {msg && <p className="text-xs text-accent">{msg}</p>}
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-sm">English source messages (from your flow)</h2>
          <p className="text-xs text-muted">
            Edit wording on the Train bot canvas. This list is read-only reference for translators.
            Full per-language text fields can be wired next once languages are added.
          </p>
          {nodes.map((n) => (
            <div key={n.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <p className="text-xs text-accent font-medium">
                {n.isWelcome ? "Welcome" : n.title || "Message"}
              </p>
              <p className="text-sm">{n.body}</p>
              {n.options?.length > 0 && (
                <ul className="text-xs text-muted list-disc pl-4">
                  {n.options.map((o) => (
                    <li key={o.id}>Option: {o.label}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
