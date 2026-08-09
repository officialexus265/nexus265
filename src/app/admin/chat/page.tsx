"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Send, BookOpen, MessageSquare, Bell, BellOff, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  notifyNewChat,
  stopAlert,
  requestNotifyPermission,
  startAlert,
} from "@/lib/chat-alerts";

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
  const [alertsOn, setAlertsOn] = useState(true);
  const [notifyReady, setNotifyReady] = useState(false);
  const [installHint, setInstallHint] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const knownSessionIds = useRef<Set<string>>(new Set());
  const knownMsgCounts = useRef<Map<string, number>>(new Map());
  const initialLoad = useRef(true);
  const deferredPrompt = useRef<{ prompt: () => Promise<void> } | null>(null);

  const loadSessions = useCallback(() => {
    fetch("/api/chat/sessions")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const list: Session[] = Array.isArray(d) ? d : [];
        if (!initialLoad.current && alertsOn) {
          for (const s of list) {
            const isNew = !knownSessionIds.current.has(s.id);
            const prevCount = knownMsgCounts.current.get(s.id) ?? 0;
            const msgCount = s.messages?.length ?? 0;
            // API only returns last message in include take:1 — use updatedAt for visitor activity
            if (isNew && s.status === "open") {
              notifyNewChat(
                "New live chat",
                `${s.visitorName || "Visitor"} wants to talk`,
                s.id
              );
            }
          }
        }
        for (const s of list) {
          knownSessionIds.current.add(s.id);
        }
        initialLoad.current = false;
        setSessions(list);
      })
      .catch(() => {});
  }, [alertsOn]);

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

  // Heartbeat presence
  useEffect(() => {
    const beat = () => {
      fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          online: true,
          busy: !!active,
          activeSessionId: active,
        }),
      }).catch(() => {});
    };
    beat();
    const t = setInterval(beat, 15_000);
    return () => {
      clearInterval(t);
      fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: false, busy: false }),
      }).catch(() => {});
    };
  }, [active]);

  useEffect(() => {
    loadSessions();
    loadPending();
    loadFaqs();
    const t = setInterval(() => {
      loadSessions();
      if (tab === "pending") loadPending();
    }, 4000);
    return () => clearInterval(t);
  }, [tab, loadSessions]);

  // Poll messages for active + detect new visitor messages while on another chat
  useEffect(() => {
    if (!active) return;
    stickToBottom.current = true;
    const load = () => {
      fetch(`/api/chat/messages?sessionId=${active}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => {
          const list: Msg[] = Array.isArray(d) ? d : [];
          setMessages((prev) => {
            if (
              alertsOn &&
              prev.length > 0 &&
              list.length > prev.length &&
              list[list.length - 1]?.sender === "visitor"
            ) {
              notifyNewChat(
                "New message",
                list[list.length - 1].body.slice(0, 80),
                active
              );
            }
            return list;
          });
        });
    };
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [active, alertsOn]);

  // Also detect new visitor messages on non-active sessions via sessions poll
  useEffect(() => {
    if (!alertsOn) return;
    // When sessions update, check for open sessions with activity
  }, [sessions, alertsOn]);

  useEffect(() => {
    if (!stickToBottom.current) return;
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distanceFromBottom < 80;
  };

  // Selecting a chat stops the ringtone
  const selectSession = (id: string) => {
    setActive(id);
    stopAlert();
  };

  const enableAlerts = async () => {
    const ok = await requestNotifyPermission();
    setNotifyReady(ok);
    setAlertsOn(true);
    // Unlock audio on user gesture
    startAlert();
    setTimeout(() => stopAlert(), 600);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as unknown as { prompt: () => Promise<void> };
      setInstallHint(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installPwa = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      setInstallHint(false);
    } else {
      alert(
        "To install: open browser menu → “Add to Home Screen” / “Install app”. Then open nexus265 from your home screen so chat alerts stay active."
      );
    }
  };

  const send = async () => {
    if (!text.trim() || !active) return;
    const body = text.trim();
    setText("");
    stickToBottom.current = true;
    stopAlert();
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

          <div className="flex flex-wrap gap-2 ml-auto items-center">
            <button
              type="button"
              onClick={() => (alertsOn ? (setAlertsOn(false), stopAlert()) : enableAlerts())}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5",
                alertsOn
                  ? "border-accent/50 text-accent bg-accent/10"
                  : "border-border text-muted"
              )}
            >
              {alertsOn ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              {alertsOn ? "Alerts on" : "Alerts off"}
            </button>
            <button
              type="button"
              onClick={installPwa}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:text-white flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Install app
            </button>
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
        {installHint && (
          <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-3">
            <p className="text-xs text-accent">
              Install this app on your phone for stronger chat alerts when the browser is in the background.
            </p>
          </div>
        )}
        {!notifyReady && alertsOn && (
          <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-3">
            <button type="button" onClick={enableAlerts} className="text-xs text-muted underline">
              Click to allow notifications & unlock alert sound
            </button>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === "inbox" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 min-h-[70vh] md:h-[calc(100dvh-10rem)]">
            <div className="border border-border rounded-xl overflow-hidden bg-card flex flex-col max-h-[40vh] md:max-h-none">
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
                    onClick={() => selectSession(s.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 border-b border-border/50 hover:bg-white/5",
                      active === s.id && "bg-primary/15"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{s.visitorName || "Visitor"}</p>
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wide",
                          s.status === "open" ? "text-accent" : "text-muted"
                        )}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted truncate">
                      {s.messages?.[0]?.body || "—"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-border rounded-xl bg-card md:col-span-2 flex flex-col overflow-hidden min-h-[50vh] md:min-h-0">
              {!active ? (
                <div className="flex-1 flex items-center justify-center text-muted text-sm px-4 text-center">
                  Select a conversation. Keep this page (or the installed app) open to hear the
                  ringtone when someone starts a chat.
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
