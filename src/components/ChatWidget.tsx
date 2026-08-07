"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = {
  id: string;
  sender: "bot" | "visitor" | "admin";
  body: string;
  createdAt?: string;
};

type FaqOption = { label: string; href?: string; action?: string; nextFaqId?: string };
type Faq = {
  id: string;
  question: string;
  answer: string;
  options?: FaqOption[] | null;
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [humanMode, setHumanMode] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat/faq")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setFaqs(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sessionId || !humanMode || !open) return;
    const load = () => {
      fetch(`/api/chat/messages?sessionId=${sessionId}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (!Array.isArray(data)) return;
          setMessages((prev) => {
            const bot = prev.filter((m) => m.sender === "bot");
            const live = data.map((m: { id: string; sender: string; body: string }) => ({
              id: m.id,
              sender: m.sender as "visitor" | "admin",
              body: m.body,
            }));
            return [...bot, ...live];
          });
        })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [sessionId, humanMode, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const pushBot = (body: string) => {
    setMessages((m) => [
      ...m,
      { id: `bot-${Date.now()}-${Math.random()}`, sender: "bot", body },
    ]);
  };

  const pushVisitor = (body: string) => {
    setMessages((m) => [
      ...m,
      { id: `v-${Date.now()}`, sender: "visitor", body },
    ]);
  };

  const showWelcome = () => {
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        body: "Hi! Welcome to nexus265. How can I help you today? Pick an option below, or type your question.",
      },
    ]);
  };

  const openChat = () => {
    setOpen(true);
    if (messages.length === 0) showWelcome();
  };

  const connectHuman = async (prefill?: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Visitor",
          message: prefill || "I'd like to talk to a human agent.",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data.id);
        setHumanMode(true);
        pushBot(
          "You're connected to the developer queue. Type your message — they'll reply as soon as they can."
        );
      } else {
        pushBot(
          "Couldn't reach live chat right now (database may be offline). Please use the Contact page or WhatsApp."
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const selectFaq = (faq: Faq) => {
    pushVisitor(faq.question);
    pushBot(faq.answer);

    const opts = (faq.options || []) as FaqOption[];
    const wantsHuman = opts.some((o) => o.action === "human") && faq.question.toLowerCase().includes("human");
    if (wantsHuman || faq.question.toLowerCase().includes("talk to a human")) {
      // still show options; user can confirm
    }
  };

  const handleOption = async (opt: FaqOption) => {
    if (opt.action === "human") {
      pushVisitor(opt.label);
      await connectHuman();
      return;
    }
    if (opt.href) {
      pushVisitor(opt.label);
      pushBot(`Opening: ${opt.label}. You can also continue chatting here.`);
      window.location.href = opt.href;
      return;
    }
    if (opt.nextFaqId) {
      const next = faqs.find((f) => f.id === opt.nextFaqId);
      if (next) selectFaq(next);
    }
  };

  const matchFaq = (input: string): Faq | null => {
    const q = input.toLowerCase().trim();
    return (
      faqs.find((f) => f.question.toLowerCase() === q) ||
      faqs.find((f) => q.includes(f.question.toLowerCase()) || f.question.toLowerCase().includes(q)) ||
      null
    );
  };

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    pushVisitor(body);

    if (humanMode && sessionId) {
      await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text: body, sender: "visitor" }),
      });
      return;
    }

    const matched = matchFaq(body);
    if (matched) {
      pushBot(matched.answer);
      return;
    }

    // No match — reserve question + offer human
    fetch("/api/chat/pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: body, sessionId }),
    }).catch(() => {});

    pushBot(
      "I don't have information on that yet. Would you like to be connected to the developer?"
    );
  };

  const menuFaqs = faqs.filter((f) => f.isActive !== false);

  return (
    <>
      <button
        type="button"
        onClick={openChat}
        className="fixed bottom-6 right-6 z-40 btn-accent shadow-lg rounded-full w-14 h-14 justify-center p-0"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(100vw-2rem,380px)] h-[520px] max-h-[75vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/10">
            <div>
              <p className="font-semibold text-sm">nexus265 Assistant</p>
              <p className="text-xs text-muted">
                {humanMode ? "Live with developer" : "Automated help + live agent"}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="p-1 text-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                  m.sender === "visitor"
                    ? "ml-auto bg-primary text-white"
                    : m.sender === "admin"
                      ? "bg-accent/20 text-foreground border border-accent/30"
                      : "bg-white/5 text-foreground"
                )}
              >
                {m.body}
              </div>
            ))}

            {/* Quick options when not in human mode */}
            {!humanMode && menuFaqs.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {menuFaqs.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => selectFaq(f)}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/40 text-indigo-200 hover:bg-primary/20 transition"
                  >
                    {f.question}
                  </button>
                ))}
              </div>
            )}

            {/* Options from last bot answer that has options */}
            {!humanMode &&
              (() => {
                const lastBot = [...messages].reverse().find((m) => m.sender === "bot");
                if (!lastBot) return null;
                const faq = faqs.find((f) => f.answer === lastBot.body);
                const opts = (faq?.options || []) as FaqOption[];
                if (!opts.length) {
                  // always offer human after unknown
                  if (lastBot.body.includes("don't have information")) {
                    return (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => connectHuman(messages.filter((m) => m.sender === "visitor").slice(-1)[0]?.body)}
                          className="text-xs px-3 py-1.5 rounded-full border border-accent/50 text-accent hover:bg-accent/10"
                        >
                          Yes, connect me
                        </button>
                        <button
                          type="button"
                          onClick={showWelcome}
                          className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-muted hover:bg-white/5"
                        >
                          Back to menu
                        </button>
                      </div>
                    );
                  }
                  return null;
                }
                return (
                  <div className="flex flex-wrap gap-2">
                    {opts.map((opt, i) =>
                      opt.href ? (
                        <Link
                          key={i}
                          href={opt.href}
                          className="text-xs px-3 py-1.5 rounded-full border border-primary/40 text-indigo-200 hover:bg-primary/20"
                        >
                          {opt.label}
                        </Link>
                      ) : (
                        <button
                          key={i}
                          type="button"
                          disabled={busy}
                          onClick={() => handleOption(opt)}
                          className="text-xs px-3 py-1.5 rounded-full border border-primary/40 text-indigo-200 hover:bg-primary/20"
                        >
                          {opt.label}
                        </button>
                      )
                    )}
                  </div>
                );
              })()}

            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-border space-y-2">
            {!humanMode && !name && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional, for live agent)"
                className="w-full px-3 py-2 rounded-xl bg-background border border-border outline-none focus:border-primary text-xs"
              />
            )}
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={humanMode ? "Message the developer..." : "Type a question..."}
                className="flex-1 px-3 py-2 rounded-xl bg-background border border-border outline-none focus:border-primary text-sm"
              />
              <button type="button" onClick={send} className="btn-primary p-2.5">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
