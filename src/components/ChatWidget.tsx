"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { id: string; sender: string; body: string; createdAt: string };

export function ChatWidget({ openTrigger }: { openTrigger?: number }) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openTrigger && openTrigger > 0) setOpen(true);
  }, [openTrigger]);

  useEffect(() => {
    if (!sessionId || !open) return;
    const load = () => {
      fetch(`/api/chat/messages?sessionId=${sessionId}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setMessages(Array.isArray(data) ? data : []))
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [sessionId, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const start = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: "Hi, I'd like to talk." }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data.id);
        setStarted(true);
        setMessages(data.messages || []);
      } else {
        alert(data.error || "Could not start chat. Is the database connected?");
      }
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!text.trim() || !sessionId) return;
    const body = text.trim();
    setText("");
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, text: body, sender: "visitor" }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((m) => [...m, msg]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 btn-accent shadow-lg rounded-full w-14 h-14 justify-center p-0"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(100vw-2rem,360px)] h-[480px] max-h-[70vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/10">
            <div>
              <p className="font-semibold text-sm">Talk to Developer</p>
              <p className="text-xs text-muted">Usually replies soon</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="p-1 text-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!started ? (
            <div className="flex-1 p-4 flex flex-col justify-center gap-3">
              <p className="text-sm text-muted">Enter your name to start chatting.</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border outline-none focus:border-primary text-sm"
              />
              <button
                type="button"
                disabled={busy || !name.trim()}
                onClick={start}
                className="btn-primary justify-center text-sm disabled:opacity-50"
              >
                {busy ? "Starting..." : "Start chat"}
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                      m.sender === "visitor"
                        ? "ml-auto bg-primary text-white"
                        : "bg-white/5 text-foreground"
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
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 rounded-xl bg-background border border-border outline-none focus:border-primary text-sm"
                />
                <button type="button" onClick={send} className="btn-primary p-2.5">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
