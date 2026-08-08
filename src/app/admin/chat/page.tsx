"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Send, BookOpen, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Session = {
  id: string;
  visitorName: string | null;
  status: string;
  updatedAt: string;
  messages: { body: string; sender: string }[];
};

type Msg = { id: string; sender: string; body: string; createdAt: string };

type Pending = { id: string; question: string; resolved: boolean; createdAt: string };

type Faq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
};

export default function AdminChatPage() {
  const [tab, setTab] = useState<"inbox" | "faq" | "pending">("inbox");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "" });
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadSessions = () => {
    fetch("/api/chat/sessions")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSessions(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  const loadPending = () => {
    fetch("/api/chat/pending")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPending(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  const loadFaqs = () => {
    fetch("/api/chat/faq")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setFaqs(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => {
    loadSessions();
    loadPending();
    loadFaqs();
    const t = setInterval(() => {
      loadSessions();
      if (tab === "pending") loadPending();
    }, 4000);
    return () => clearInterval(t);
  }, [tab]);

  useEffect(() => {
    if (!active) return;
    stickToBottom.current = true;
    const load = () => {
      fetch(`/api/chat/messages?sessionId=${active}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setMessages(Array.isArray(d) ? d : []));
    };
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [active]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const onMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Only keep auto-scroll if user is near the bottom
    stickToBottom.current = distanceFromBottom < 80;
  };

  useEffect(() => {
    if (!stickToBottom.current) return;
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !active) return;
    const body = text.trim();
    setText("");
    stickToBottom.current = true;
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

  const addFaq = async () => {
    if (!faqForm.question || !faqForm.answer) return;
    await fetch("/api/chat/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...faqForm,
        options: [{ label: "Talk to a human agent", action: "human" }],
      }),
    });
    setFaqForm({ question: "", answer: "" });
    loadFaqs();
  };

  const resolvePending = async (p: Pending, answer: string) => {
    await fetch("/api/chat/pending", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: p.id,
        createFaq: !!answer,
        question: p.question,
        answer,
      }),
    });
    loadPending();
    loadFaqs();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-white/5 text-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-lg">Live chat</h1>
          <div className="flex gap-2 ml-auto">
            {(
              [
                ["inbox", "Inbox", MessageSquare],
                ["faq", "Bot answers", BookOpen],
                ["pending", "Unknown questions", BookOpen],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5",
                  tab === id
                    ? "border-primary bg-primary/20 text-white"
                    : "border-border text-muted hover:text-white"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === "inbox" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-10rem)]">
            <div className="border border-border rounded-xl overflow-hidden bg-card flex flex-col">
              <div className="px-3 py-2 border-b border-border text-sm font-medium">
                Conversations
              </div>
              <div className="overflow-y-auto flex-1">
                {sessions.length === 0 && (
                  <p className="p-4 text-sm text-muted">No live chats yet.</p>
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
                  <div
                    ref={messagesContainerRef}
                    onScroll={onMessagesScroll}
                    className="flex-1 overflow-y-auto p-4 space-y-2"
                  >
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
        )}

        {tab === "faq" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="font-semibold">Add automated answer</h2>
              <input
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                placeholder="Menu label / question"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary"
              />
              <textarea
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                placeholder="Bot answer"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary resize-none"
              />
              <button type="button" onClick={addFaq} className="btn-primary text-sm">
                Save answer
              </button>
            </div>
            <div className="space-y-2">
              {faqs.map((f) => (
                <div key={f.id} className="bg-card border border-border rounded-xl p-4">
                  <p className="font-medium text-sm">{f.question}</p>
                  <p className="text-xs text-muted mt-1">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "pending" && (
          <div className="space-y-3 max-w-2xl">
            <p className="text-sm text-muted">
              Questions visitors typed that the bot didn&apos;t know. Add an answer to teach the bot.
            </p>
            {pending.filter((p) => !p.resolved).length === 0 && (
              <p className="text-sm text-muted">No pending questions.</p>
            )}
            {pending
              .filter((p) => !p.resolved)
              .map((p) => (
                <PendingCard key={p.id} item={p} onSave={(answer) => resolvePending(p, answer)} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PendingCard({
  item,
  onSave,
}: {
  item: Pending;
  onSave: (answer: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
      <p className="text-sm font-medium">{item.question}</p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write the answer the bot should give next time..."
        rows={2}
        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(answer)}
          disabled={!answer.trim()}
          className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
        >
          Save as bot answer
        </button>
        <button
          type="button"
          onClick={() => onSave("")}
          className="btn-outline text-xs py-1.5 px-3"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
