"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Session = {
  id: string;
  visitorName: string | null;
  status: string;
  updatedAt: string;
  messages: { body: string; sender: string }[];
};

type Msg = { id: string; sender: string; body: string; createdAt: string };

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadSessions = () => {
    fetch("/api/chat/sessions")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSessions(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => {
    loadSessions();
    const t = setInterval(loadSessions, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!active) return;
    const load = () => {
      fetch(`/api/chat/messages?sessionId=${active}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setMessages(Array.isArray(d) ? d : []));
    };
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !active) return;
    const body = text.trim();
    setText("");
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: active, text: body, sender: "admin" }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((m) => [...m, msg]);
      loadSessions();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-white/5 text-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-lg">Live chat</h1>
          <p className="text-xs text-muted">Phase 5 foundation — PWA alerts coming next</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
        <div className="border border-border rounded-xl overflow-hidden bg-card md:col-span-1 flex flex-col">
          <div className="px-3 py-2 border-b border-border text-sm font-medium">Conversations</div>
          <div className="overflow-y-auto flex-1">
            {sessions.length === 0 && (
              <p className="p-4 text-sm text-muted">No chats yet. Needs database.</p>
            )}
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  "w-full text-left px-3 py-3 border-b border-border/50 hover:bg-white/5",
                  active === s.id && "bg-primary/15"
                )}
              >
                <p className="text-sm font-medium">{s.visitorName || "Visitor"}</p>
                <p className="text-xs text-muted truncate">
                  {s.messages?.[0]?.body || s.status}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-xl bg-card md:col-span-2 flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                      m.sender === "admin"
                        ? "ml-auto bg-primary text-white"
                        : "bg-white/5"
                    )}
                  >
                    {m.body}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  className="flex-1 px-3 py-2 rounded-xl bg-background border border-border outline-none focus:border-primary text-sm"
                  placeholder="Reply..."
                />
                <button type="button" onClick={send} className="btn-primary p-2.5">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
