"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  MessageSquare,
  ExternalLink,
  UserRound,
  Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BotOption = {
  id: string;
  label: string;
  action: "next" | "url" | "human" | "next_url";
  nextNodeId?: string | null;
  url?: string | null;
  sortOrder?: number;
};

type BotNodeData = {
  title: string;
  body: string;
  isWelcome?: boolean;
  options: BotOption[];
  onChange?: (id: string, patch: Partial<BotNodeData>) => void;
  onDelete?: (id: string) => void;
  onAddOption?: (id: string) => void;
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function MessageNode({ id, data, selected }: NodeProps) {
  const d = data as BotNodeData;
  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-lg min-w-[260px] max-w-[300px] text-left",
        d.isWelcome ? "border-accent ring-1 ring-accent/40" : "border-border",
        selected && "ring-2 ring-primary"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2.5 !h-2.5" />
      <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-accent truncate">
          {d.isWelcome ? "Welcome" : d.title || "Message"}
        </span>
        {!d.isWelcome && (
          <button
            type="button"
            className="text-muted hover:text-red-400"
            onClick={() => d.onDelete?.(id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="p-3 space-y-2">
        {!d.isWelcome && (
          <input
            value={d.title}
            onChange={(e) => d.onChange?.(id, { title: e.target.value })}
            className="w-full text-xs px-2 py-1 rounded bg-background border border-border outline-none"
            placeholder="Admin title"
          />
        )}
        <textarea
          value={d.body}
          onChange={(e) => d.onChange?.(id, { body: e.target.value })}
          rows={3}
          className="w-full text-xs px-2 py-1.5 rounded bg-background border border-border outline-none resize-none"
          placeholder="Bot message shown to visitor..."
        />
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted">Options</p>
          {(d.options || []).map((opt, i) => (
            <div key={opt.id} className="relative border border-border/60 rounded-lg p-2 space-y-1 bg-background/50">
              <input
                value={opt.label}
                onChange={(e) => {
                  const options = [...d.options];
                  options[i] = { ...options[i], label: e.target.value };
                  d.onChange?.(id, { options });
                }}
                className="w-full text-xs px-1.5 py-1 rounded bg-card border border-border outline-none"
                placeholder="Button label"
              />
              <select
                value={opt.action}
                onChange={(e) => {
                  const options = [...d.options];
                  options[i] = {
                    ...options[i],
                    action: e.target.value as BotOption["action"],
                  };
                  d.onChange?.(id, { options });
                }}
                className="w-full text-[11px] px-1.5 py-1 rounded bg-card border border-border outline-none"
              >
                <option value="next">Go to next message</option>
                <option value="url">Open website page</option>
                <option value="human">Talk to human agent</option>
                <option value="next_url">Next message + page link</option>
              </select>
              {(opt.action === "url" || opt.action === "next_url") && (
                <input
                  value={opt.url || ""}
                  onChange={(e) => {
                    const options = [...d.options];
                    options[i] = { ...options[i], url: e.target.value };
                    d.onChange?.(id, { options });
                  }}
                  className="w-full text-[11px] px-1.5 py-1 rounded bg-card border border-border outline-none"
                  placeholder="/selling or /contact#hire"
                />
              )}
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted flex items-center gap-1">
                  {opt.action === "human" && <UserRound className="w-3 h-3" />}
                  {(opt.action === "url" || opt.action === "next_url") && (
                    <ExternalLink className="w-3 h-3" />
                  )}
                  {opt.action === "next" || opt.action === "next_url" ? "Drag handle →" : ""}
                </span>
                <button
                  type="button"
                  className="text-[10px] text-red-400"
                  onClick={() => {
                    const options = d.options.filter((_, j) => j !== i);
                    d.onChange?.(id, { options });
                  }}
                >
                  Remove
                </button>
              </div>
              {(opt.action === "next" || opt.action === "next_url") && (
                <Handle
                  type="source"
                  position={Position.Bottom}
                  id={opt.id}
                  className="!bg-accent !w-2.5 !h-2.5 !bottom-[-6px]"
                  style={{ left: `${((i + 1) / (d.options.length + 1)) * 100}%` }}
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => d.onAddOption?.(id)}
            className="w-full text-[11px] py-1.5 rounded-lg border border-dashed border-border text-muted hover:text-white hover:border-primary/50"
          >
            + Add option
          </button>
        </div>
      </div>
      {/* default source for nodes with no option handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className="!bg-primary/40 !w-2 !h-2 opacity-0"
      />
    </div>
  );
}

const nodeTypes = { message: MessageNode };

export default function BotTrainerPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  const patchNode = useCallback(
    (id: string, patch: Partial<BotNodeData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
        )
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id || (n.data as BotNodeData).isWelcome));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    },
    [setNodes, setEdges]
  );

  const addOption = useCallback(
    (id: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n;
          const data = n.data as BotNodeData;
          const opt: BotOption = {
            id: uid("opt"),
            label: "New option",
            action: "next",
            nextNodeId: null,
            url: "",
          };
          return { ...n, data: { ...data, options: [...(data.options || []), opt] } };
        })
      );
    },
    [setNodes]
  );

  const bindHandlers = useCallback(
    (list: Node[]) =>
      list.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onChange: patchNode,
          onDelete: deleteNode,
          onAddOption: addOption,
        },
      })),
    [patchNode, deleteNode, addOption]
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/bot/flow");
    const data = await res.json();
    const graphNodes: Node[] = (data.nodes || []).map(
      (n: {
        id: string;
        title: string;
        body: string;
        isWelcome: boolean;
        positionX: number;
        positionY: number;
        options: BotOption[];
      }) => ({
        id: n.id,
        type: "message",
        position: { x: n.positionX || 0, y: n.positionY || 0 },
        data: {
          title: n.title,
          body: n.body,
          isWelcome: n.isWelcome,
          options: n.options || [],
        },
      })
    );

    const graphEdges: Edge[] = [];
    for (const n of data.nodes || []) {
      for (const o of n.options || []) {
        if (o.nextNodeId && (o.action === "next" || o.action === "next_url")) {
          graphEdges.push({
            id: `e-${o.id}`,
            source: n.id,
            target: o.nextNodeId,
            sourceHandle: o.id,
            label: o.label,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "#6366f1" },
          });
        }
      }
    }

    setNodes(bindHandlers(graphNodes));
    setEdges(graphEdges);
    setLoaded(true);
  }, [bindHandlers, setNodes, setEdges]);

  useEffect(() => {
    load();
  }, [load]);

  // Re-bind handlers when nodes change from React Flow internals
  useEffect(() => {
    if (!loaded) return;
    setNodes((nds) => bindHandlers(nds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !connection.sourceHandle) return;
      // Update option nextNodeId
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== connection.source) return n;
          const data = n.data as BotNodeData;
          const options = data.options.map((o) =>
            o.id === connection.sourceHandle
              ? { ...o, nextNodeId: connection.target, action: o.action === "url" ? "next_url" : o.action === "human" ? "human" : o.action }
              : o
          );
          return { ...n, data: { ...data, options } };
        })
      );
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: `e-${connection.sourceHandle}`,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "#6366f1" },
          },
          eds.filter((e) => e.sourceHandle !== connection.sourceHandle)
        )
      );
    },
    [setNodes, setEdges]
  );

  const addMessage = () => {
    const id = uid("node");
    const node: Node = {
      id,
      type: "message",
      position: { x: 120 + Math.random() * 200, y: 180 + Math.random() * 160 },
      data: {
        title: "New message",
        body: "",
        isWelcome: false,
        options: [],
        onChange: patchNode,
        onDelete: deleteNode,
        onAddOption: addOption,
      },
    };
    setNodes((nds) => [...nds, node]);
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const payload = {
        nodes: nodes.map((n) => {
          const d = n.data as BotNodeData;
          // sync nextNodeId from edges
          const options = (d.options || []).map((o) => {
            const edge = edges.find((e) => e.source === n.id && e.sourceHandle === o.id);
            return {
              ...o,
              nextNodeId: edge?.target || o.nextNodeId || null,
            };
          });
          return {
            id: n.id,
            title: d.title,
            body: d.body,
            isWelcome: !!d.isWelcome,
            positionX: n.position.x,
            positionY: n.position.y,
            options,
          };
        }),
      };
      const res = await fetch("/api/bot/flow", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMsg(err.error || "Save failed — is the database connected?");
      } else {
        setMsg("Flow saved. Visitors will use this bot path.");
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b border-border bg-card/50 px-4 py-3 flex flex-wrap items-center gap-3 shrink-0">
        <Link href="/admin" className="p-2 rounded-lg hover:bg-white/5 text-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent" />
            Train bot
          </h1>
          <p className="text-xs text-muted">
            Visual flow — welcome message → options → responses. Drag handles to connect.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href="/admin/bot/translations" className="btn-outline text-xs py-2 px-3">
            <Languages className="w-4 h-4" />
            Translations
          </Link>
          <Link href="/admin/chat" className="btn-outline text-xs py-2 px-3">
            Live chat
          </Link>
          <button type="button" onClick={addMessage} className="btn-outline text-xs py-2 px-3">
            <Plus className="w-4 h-4" />
            Add message
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-primary text-xs py-2 px-3 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save flow"}
          </button>
        </div>
      </div>
      {msg && (
        <div className="px-4 py-2 text-xs border-b border-border bg-primary/10 text-indigo-200">
          {msg}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={18} size={1} color="#ffffff10" />
          <Controls />
          <MiniMap
            nodeColor={(n) => ((n.data as BotNodeData).isWelcome ? "#22d3ee" : "#6366f1")}
            maskColor="#0a0a12cc"
          />
        </ReactFlow>
      </div>
      <div className="border-t border-border px-4 py-2 text-[11px] text-muted shrink-0 flex flex-wrap gap-4">
        <span>
          <strong className="text-accent">Welcome</strong> is the first message
        </span>
        <span>Add options on a card → choose action → drag the handle to the next message</span>
        <span>Open page: set path like <code className="text-indigo-300">/selling</code></span>
        <span>Human agent: connects to live chat</span>
      </div>
    </div>
  );
}
