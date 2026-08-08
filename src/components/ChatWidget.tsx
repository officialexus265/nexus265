"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings";
import { speakAsAgent, stopAgentVoice } from "@/lib/agent-voice";

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
  const { settings } = useSettings();
  const [visitorGender, setVisitorGender] = useState<"male" | "female" | null>(null);
  const [pickedAgent, setPickedAgent] = useState(false);
  const [open, setOpen] = useState(false);
  const [botNodes, setBotNodes] = useState<BotNode[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [humanMode, setHumanMode] = useState(false);

  const effectiveGender: "male" | "female" =
    visitorGender || (settings.agentGender === "male" ? "male" : "female");
  const agentNameFemale = settings.agentNameFemale || settings.agentName || "Maya";
  const agentNameMale = settings.agentNameMale || settings.agentName || "Alex";
  const agentNameHuman = settings.agentNameHuman || "Developer";
  const agentName = humanMode
    ? agentNameHuman
    : effectiveGender === "male"
      ? agentNameMale
      : agentNameFemale;
  const agentAvatar = humanMode
    ? "" // neutral — no gendered face when live with developer
    : effectiveGender === "male"
      ? settings.agentAvatarMale
      : settings.agentAvatarFemale;
  const canPickAgent =
    settings.allowVisitorAgentPick !== false &&
    !!(settings.agentAvatarMale && settings.agentAvatarFemale);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const genderRef = useRef(effectiveGender);
  genderRef.current = effectiveGender;
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, [messages, open, currentOptions, isTyping]);

  /** Typing delay scales with response length (min ~0.6s, max ~3.5s) */
  const typingDelayMs = (body: string) => {
    const len = body.trim().length;
    // ~28ms per character feels natural for reading/typing simulation
    const ms = 600 + len * 28;
    return Math.min(3500, Math.max(600, ms));
  };

  const pushBot = (body: string, id?: string) => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setIsTyping(true);
    const delay = typingDelayMs(body);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      setMessages((m) => [
        ...m,
        { id: id || `bot-${Date.now()}`, sender: "bot", body },
      ]);
      typingTimer.current = null;
      // Free browser TTS — only if enabled in settings
      const st = settingsRef.current;
      if (st.agentVoiceEnabled) {
        speakAsAgent(body, genderRef.current);
      }
    }, delay);
  };

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  const pushVisitor = (body: string) => {
    setMessages((m) => [
      ...m,
      { id: `v-${Date.now()}`, sender: "visitor", body },
    ]);
  };

  const showWelcome = () => {
    const welcome = botNodes.find((n) => n.isWelcome) || botNodes[0];
    setHumanMode(false);
    setMessages([]);
    if (welcome) {
      setCurrentNodeId(welcome.id);
      pushBot(welcome.body, welcome.id);
    } else {
      setCurrentNodeId(null);
      pushBot("Hi! Welcome to nexus265. How can I help you today?", "welcome");
    }
  };

  useEffect(() => {
    if (!open) return;
    if (canPickAgent && !pickedAgent) return;
    if (messages.length === 0 && botNodes.length > 0) showWelcome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, botNodes, pickedAgent, canPickAgent]);

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
      {!open && (
        <button
          type="button"
          onClick={openChat}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-0 rounded-full shadow-2xl shadow-indigo-500/25 border border-white/10 bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-indigo-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Chat with ${agentName}`}
        >
          <span className="relative flex h-14 w-14 items-center justify-center">
            {agentAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agentAvatar}
                alt=""
                className="h-14 w-14 rounded-full object-cover ring-2 ring-white/30"
              />
            ) : (
              <MessageCircle className="h-6 w-6" strokeWidth={2.25} />
            )}
            <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-indigo-600" />
          </span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap pr-0 text-sm font-medium opacity-0 transition-all duration-300 group-hover:max-w-[140px] group-hover:pr-4 group-hover:opacity-100">
            Chat with {agentName}
          </span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(100vw-2rem,380px)] h-[520px] max-h-[75vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/10">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  {agentAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-indigo-200">
                      {agentName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{agentName}</p>
                  <p className="text-xs text-muted">
                    {humanMode ? "Live chat · neutral" : "Assistant · online"}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopAgentVoice();
                setOpen(false);
              }}
              className="p-1 text-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {open && canPickAgent && !pickedAgent && (
              <div className="space-y-3 py-2">
                <p className="text-sm text-center text-muted">
                  Who would you like to chat with?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["female", agentNameFemale, settings.agentAvatarFemale],
                      ["male", agentNameMale, settings.agentAvatarMale],
                    ] as const
                  ).map(([g, label, src]) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setVisitorGender(g);
                        setPickedAgent(true);
                        setTimeout(() => showWelcome(), 50);
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary/10 transition"
                    >
                      <span className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-primary/20">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt={label} className="w-full h-full object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-lg font-semibold">
                            {label[0]}
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-medium">{label}</span>
                      <span className="text-[10px] text-muted capitalize">{g}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="w-full text-xs text-muted underline"
                  onClick={() => {
                    setPickedAgent(true);
                    setTimeout(() => showWelcome(), 50);
                  }}
                >
                  Continue with default
                </button>
              </div>
            )}

            {(pickedAgent || !canPickAgent) && (
            <>

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-2 max-w-[92%]",
                  m.sender === "visitor" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                {(m.sender === "bot" || m.sender === "admin") && (
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    {agentAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={agentAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-semibold text-indigo-200">
                        {agentName.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                    m.sender === "visitor"
                      ? "bg-primary text-white"
                      : m.sender === "admin"
                        ? "bg-accent/20 text-foreground border border-accent/30"
                        : "bg-white/5 text-foreground"
                  )}
                >
                  {m.body}
                </div>
              </div>
            ))}

            {!humanMode && !isTyping && currentOptions.length > 0 && (
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
              !isTyping &&
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

            {isTyping && (
              <div className="flex gap-2 items-end">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0">
                  {agentAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={agentAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-semibold text-indigo-200">
                      {agentName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="rounded-2xl px-4 py-3 bg-white/5 text-foreground inline-flex items-center gap-1.5">
                  <span className="sr-only">{agentName} is typing</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
            </>
            )}
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
