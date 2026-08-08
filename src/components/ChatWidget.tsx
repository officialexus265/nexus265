"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = {
  id: string;
  sender: "bot" | "visitor" | "admin";
  body: string;
};

type BotOpt = {
  id: string;
  label: string;
  action: string;
  nextNodeId?: string | null;
  url?: string | null;
};

type BotNode = {
  id: string;
  body: string;
  isWelcome?: boolean;
  options?: BotOpt[];
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [botNodes, setBotNodes] = useState<BotNode[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [humanMode, setHumanMode] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentNode = botNodes.find((n) => n.id === currentNodeId) || null;
  const currentOptions = currentNode?.options || [];

  useEffect(() => {
    fetch("/api/bot/flow")
      .then((r) => (r.ok ? r.json() : { nodes: [] }))
      .then((d) => {
        const nodes: BotNode[] = d.nodes || [];
        setBotNodes(nodes);
        const welcome = nodes.find((n) => n.isWelcome) || nodes[0];
        if (welcome) setCurrentNodeId(welcome.id);
      })
      .catch(() => {});

    const openHandler = () => setOpen(true);
    window.addEventListener("nexus265-open-chat", openHandler);
    return () => window.removeEventListener("nexus265-open-chat", openHandler);
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
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, open, currentOptions]);

  const pushBot = (body: string, id?: string) => {
    setMessages((m) => [
      ...m,
      { id: id || `bot-${Date.now()}`, sender: "bot", body },
    ]);
  };

  const pushVisitor = (body: string) => {
    setMessages((m) => [
      ...m,
      { id: `v-${Date.now()}`, sender: "visitor", body },
    ]);
  };

  const showWelcome = () => {
    const welcome = botNodes.find((n) => n.isWelcome) || botNodes[0];
    if (welcome) {
      setCurrentNodeId(welcome.id);
      setHumanMode(false);
      setMessages([{ id: welcome.id, sender: "bot", body: welcome.body }]);
    } else {
      setMessages([
        {
          id: "welcome",
          sender: "bot",
          body: "Hi! Welcome to nexus265. How can I help you today?",
        },
      ]);
    }
  };

  useEffect(() => {
    if (open && messages.length === 0 && botNodes.length > 0) showWelcome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, botNodes]);

  const openChat = () => {
    setOpen(true);
  };

  const connectHuman = async (prefill?: string) => {
    setBusy(true);
    try {
      let presenceNote = "";
      try {
        const pr = await fetch("/api/chat/presence");
        if (pr.ok) {
          const p = await pr.json();
          if (p.busy) {
            presenceNote =
              "The agent is currently assisting other customers and will get to you shortly after.";
          } else if (!p.online) {
            presenceNote =
              "The agent is offline right now — leave a message and they'll be notified.";
          }
        }
      } catch {
        /* ignore */
      }

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
        setCurrentNodeId(null);
        pushBot(
          presenceNote
            ? presenceNote + " Type your message below."
            : "You're connected to the developer queue. Type your message — they'll reply as soon as they can."
        );
      } else {
        pushBot(
          "Couldn't reach live chat right now. Please use the Contact page or WhatsApp."
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const handleOption = async (opt: BotOpt) => {
    pushVisitor(opt.label);

    if (opt.action === "human") {
      await connectHuman(opt.label);
      return;
    }

    if (opt.action === "url" && opt.url) {
      pushBot(`Opening ${opt.label}…`);
      window.location.href = opt.url;
      return;
    }

    if (opt.action === "next" || opt.action === "next_url") {
      if (opt.nextNodeId) {
        const next = botNodes.find((n) => n.id === opt.nextNodeId);
        if (next) {
          setCurrentNodeId(next.id);
          pushBot(next.body, next.id);
        } else {
          pushBot("That path isn't connected yet. Try another option or talk to a human.");
        }
      } else {
        pushBot("That path isn't connected yet. Connect it in Train bot, or talk to a human.");
      }
      if (opt.action === "next_url" && opt.url) {
        // optional: open in new tab so chat remains
        window.open(opt.url, "_blank", "noopener,noreferrer");
      }
    }
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

    // Try match option labels
    const match = currentOptions.find(
      (o) => o.label.toLowerCase() === body.toLowerCase()
    );
    if (match) {
      await handleOption(match);
      return;
    }

    // Search all nodes' option labels
    for (const n of botNodes) {
      const o = (n.options || []).find(
        (x) => x.label.toLowerCase() === body.toLowerCase()
      );
      if (o) {
        await handleOption(o);
        return;
      }
    }

    fetch("/api/chat/pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: body, sessionId }),
    }).catch(() => {});

    pushBot(
      "I don't have information on that yet. Would you like to be connected to the developer?"
    );
    setCurrentNodeId(null);
  };

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
                {humanMode ? "Live with developer" : "Guided help + live agent"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 text-muted hover:text-white"
            >
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

            {!humanMode && currentOptions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {currentOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={busy}
                    onClick={() => handleOption(opt)}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/40 text-indigo-200 hover:bg-primary/20 transition"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {!humanMode &&
              messages.some((m) => m.body.includes("don't have information")) && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      connectHuman(
                        messages.filter((m) => m.sender === "visitor").slice(-1)[0]?.body
                      )
                    }
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
              )}

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
