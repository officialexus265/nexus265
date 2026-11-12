"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  ListTree,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  suggestResponseFromOption,
  suggestTitleFromOption,
} from "@/lib/bot-suggest";

type BotOption = {
  id: string;
  label: string;
  action: "next" | "url" | "human" | "next_url";
  nextNodeId?: string | null;
  url?: string | null;
  sortOrder?: number;
};

type FlowNode = {
  id: string;
  title: string;
  body: string;
  isWelcome: boolean;
  positionX: number;
  positionY: number;
  options: BotOption[];
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

type EditorMode = "list" | "flow";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeAction(action: string): BotOption["action"] {
  if (action === "url") return "next_url";
  if (action === "human") return "human";
  if (action === "next_url") return "next_url";
  if (action === "next") return "next";
  return "next";
}

type MessageFlowNode = Node<BotNodeData, "message">;

function MessageNode({ id, data, selected }: NodeProps<MessageFlowNode>) {
  const d = data;
  const connectableOptions = (d.options || []).filter(
    (o) => o.action === "next" || o.action === "next_url"
  );

  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-lg min-w-[260px] max-w-[300px] text-left relative",
        d.isWelcome ? "border-accent ring-1 ring-accent/40" : "border-border",
        selected && "ring-2 ring-primary"
      )}
      style={{ overflow: "visible" }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        isConnectable={true}
        style={{
          background: "#6366f1",
          width: 16,
          height: 16,
          border: "2px solid #0a0a12",
          top: -8,
          zIndex: 50,
        }}
      />

      <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-accent truncate">
          {d.isWelcome ? "Welcome" : d.title || "Message"}
        </span>
        {!d.isWelcome && (
          <button
            type="button"
            className="nodrag text-muted hover:text-red-400"
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
            className="nodrag w-full text-xs px-2 py-1 rounded bg-background border border-border outline-none"
            placeholder="Admin title"
          />
        )}
        <textarea
          value={d.body}
          onChange={(e) => d.onChange?.(id, { body: e.target.value })}
          rows={3}
          className="nodrag w-full text-xs px-2 py-1.5 rounded bg-background border border-border outline-none resize-none"
          placeholder="Bot message shown to visitor..."
        />
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted">Options</p>
          {(d.options || []).map((opt, i) => (
            <div
              key={opt.id}
              className="relative border border-border/60 rounded-lg p-2 space-y-1 bg-background/50"
            >
              <input
                value={opt.label}
                onChange={(e) => {
                  const options = [...d.options];
                  options[i] = { ...options[i], label: e.target.value };
                  d.onChange?.(id, { options });
                }}
                className="nodrag w-full text-xs px-1.5 py-1 rounded bg-card border border-border outline-none"
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
                className="nodrag w-full text-[11px] px-1.5 py-1 rounded bg-card border border-border outline-none"
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
                  className="nodrag w-full text-[11px] px-1.5 py-1 rounded bg-card border border-border outline-none"
                  placeholder="/selling or /contact#hire"
                />
              )}
              <div className="flex justify-between items-center gap-1 flex-wrap">
                <span className="text-[10px] text-muted flex items-center gap-1">
                  {opt.action === "human" && <UserRound className="w-3 h-3" />}
                  {(opt.action === "url" || opt.action === "next_url") && (
                    <ExternalLink className="w-3 h-3" />
                  )}
                  {(opt.action === "next" || opt.action === "next_url") && (
                    <span className="text-accent">↓ drag bottom handle</span>
                  )}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="nodrag text-[10px] text-indigo-300"
                    title="Suggest a follow-up message from this option label"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("nexus265-bot-suggest", {
                          detail: { nodeId: id, optionId: opt.id, label: opt.label },
                        })
                      );
                    }}
                  >
                    Suggest
                  </button>
                  <button
                    type="button"
                    className="nodrag text-[10px] text-red-400"
                    onClick={() => {
                      const options = d.options.filter((_, j) => j !== i);
                      d.onChange?.(id, { options });
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => d.onAddOption?.(id)}
            className="nodrag w-full text-[11px] py-1.5 rounded-lg border border-dashed border-border text-muted hover:text-white hover:border-primary/50"
          >
            + Add option
          </button>
        </div>
      </div>

      {connectableOptions.map((opt, i) => {
        const total = connectableOptions.length;
        const leftPct = total === 1 ? 50 : ((i + 1) / (total + 1)) * 100;
        return (
          <Handle
            key={opt.id}
            type="source"
            position={Position.Bottom}
            id={opt.id}
            isConnectable={true}
            style={{
              background: "#22d3ee",
              width: 16,
              height: 16,
              border: "2px solid #0a0a12",
              bottom: -8,
              left: `${leftPct}%`,
              zIndex: 50,
            }}
            title={`Connect "${opt.label}" to another message`}
          />
        );
      })}
    </div>
  );
}

const nodeTypes = { message: MessageNode };

export default function BotTrainerPage() {
  const [mode, setMode] = useState<EditorMode>("list");
  const [flowData, setFlowData] = useState<FlowNode[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<MessageFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);
  const rfInstance = useRef<{
    screenToFlowPosition: (p: { x: number; y: number }) => { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexus265_bot_editor_mode") as EditorMode | null;
      if (saved === "list" || saved === "flow") setMode(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setModePersist = (m: EditorMode) => {
    setMode(m);
    try {
      localStorage.setItem("nexus265_bot_editor_mode", m);
    } catch {
      /* ignore */
    }
  };

  const patchNode = useCallback(
    (id: string, patch: Partial<BotNodeData>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
      );
      setFlowData((list) =>
        list.map((n) => {
          if (n.id !== id) return n;
          return {
            ...n,
            title: patch.title !== undefined ? patch.title : n.title,
            body: patch.body !== undefined ? patch.body : n.body,
            options: patch.options !== undefined ? patch.options : n.options,
          };
        })
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((nds) =>
        nds.filter((n) => n.id !== id || (n.data as BotNodeData).isWelcome)
      );
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setFlowData((list) => list.filter((n) => n.id !== id || n.isWelcome));
    },
    [setNodes, setEdges]
  );

  const addOption = useCallback(
    (id: string) => {
      const opt: BotOption = {
        id: uid("opt"),
        label: "New option",
        action: "next",
        nextNodeId: null,
        url: "",
      };
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n;
          const data = n.data as BotNodeData;
          return { ...n, data: { ...data, options: [...(data.options || []), opt] } };
        })
      );
      setFlowData((list) =>
        list.map((n) =>
          n.id === id ? { ...n, options: [...(n.options || []), opt] } : n
        )
      );
    },
    [setNodes]
  );

  const bindHandlers = useCallback(
    (list: MessageFlowNode[]) =>
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

  const applyGraphFromFlowData = useCallback(
    (dataNodes: FlowNode[]) => {
      const graphNodes: MessageFlowNode[] = dataNodes.map((n) => ({
        id: n.id,
        type: "message",
        position: { x: n.positionX || 0, y: n.positionY || 0 },
        data: {
          title: n.title,
          body: n.body,
          isWelcome: n.isWelcome,
          options: n.options || [],
        },
      }));

      const graphEdges: Edge[] = [];
      for (const n of dataNodes) {
        for (const o of n.options || []) {
          if (o.nextNodeId && (o.action === "next" || o.action === "next_url")) {
            graphEdges.push({
              id: `e-${o.id}`,
              source: n.id,
              target: o.nextNodeId,
              sourceHandle: o.id,
              targetHandle: "target",
              label: o.label,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: "#a5b4fc", strokeWidth: 2 },
            });
          }
        }
      }

      setNodes(bindHandlers(graphNodes));
      setEdges(graphEdges);
    },
    [bindHandlers, setNodes, setEdges]
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/bot/flow");
    const data = await res.json();
    const dataNodes: FlowNode[] = (data.nodes || []).map(
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
        title: n.title,
        body: n.body,
        isWelcome: n.isWelcome,
        positionX: n.positionX || 0,
        positionY: n.positionY || 0,
        options: n.options || [],
      })
    );
    setFlowData(dataNodes);
    applyGraphFromFlowData(dataNodes);
    setLoaded(true);
  }, [applyGraphFromFlowData]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { nodeId, optionId, label } = (e as CustomEvent).detail || {};
      if (!nodeId || !optionId) return;
      const suggestion = suggestResponseFromOption(label || "");
      const title = suggestTitleFromOption(label || "");

      setFlowData((list) => {
        const parent = list.find((n) => n.id === nodeId);
        const opt = parent?.options.find((o) => o.id === optionId);
        if (opt?.nextNodeId) {
          setMsg("Suggested text applied to the linked message.");
          const updated = list.map((n) =>
            n.id === opt.nextNodeId ? { ...n, body: suggestion, title } : n
          );
          setTimeout(() => applyGraphFromFlowData(updated), 0);
          return updated;
        }
        const id = uid("node");
        setMsg("Created a follow-up message from this option's wording.");
        const updated: FlowNode[] = [
          ...list.map((n) => {
            if (n.id !== nodeId) return n;
            return {
              ...n,
              options: n.options.map((o) =>
                o.id === optionId
                  ? {
                      ...o,
                      nextNodeId: id,
                      action: (o.action === "url"
                        ? "next_url"
                        : o.action === "human"
                          ? "human"
                          : "next") as BotOption["action"],
                    }
                  : o
              ),
            };
          }),
          {
            id,
            title,
            body: suggestion,
            isWelcome: false,
            positionX: 200 + Math.random() * 180,
            positionY: 220 + Math.random() * 140,
            options: [],
          },
        ];
        setTimeout(() => applyGraphFromFlowData(updated), 0);
        return updated;
      });
    };
    window.addEventListener("nexus265-bot-suggest", handler);
    return () => window.removeEventListener("nexus265-bot-suggest", handler);
  }, [applyGraphFromFlowData]);

  useEffect(() => {
    if (!loaded || mode !== "flow") return;
    const merged = flowData.map((n) => {
      const existing = nodes.find((x) => x.id === n.id);
      return existing
        ? { ...n, positionX: existing.position.x, positionY: existing.position.y }
        : n;
    });
    applyGraphFromFlowData(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      let sourceHandle = connection.sourceHandle;

      if (!sourceHandle) {
        const sourceNode = nodes.find((n) => n.id === connection.source);
        const opts = (sourceNode?.data as BotNodeData | undefined)?.options || [];
        const first = opts.find((o) => o.action === "next" || o.action === "next_url");
        sourceHandle = first?.id || null;
      }

      if (!sourceHandle) return;

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== connection.source) return n;
          const data = n.data as BotNodeData;
          const options: BotOption[] = data.options.map((o) => {
            if (o.id !== sourceHandle) return o;
            let action: BotOption["action"] = "next";
            if (o.action === "url") action = "next_url";
            else if (o.action === "human") action = "human";
            else if (o.action === "next_url") action = "next_url";
            else action = "next";
            return {
              ...o,
              nextNodeId: connection.target,
              action,
            };
          });
          return { ...n, data: { ...data, options } };
        })
      );

      setFlowData((list) =>
        list.map((n) => {
          if (n.id !== connection.source) return n;
          return {
            ...n,
            options: n.options.map((o) =>
              o.id === sourceHandle
                ? { ...o, nextNodeId: connection.target }
                : o
            ),
          };
        })
      );

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            sourceHandle,
            targetHandle: connection.targetHandle || "target",
            id: `e-${sourceHandle}`,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "#a5b4fc", strokeWidth: 2 },
          },
          eds.filter((e) => e.sourceHandle !== sourceHandle)
        )
      );
      setMsg("Connected! Remember to click Save flow.");
    },
    [setNodes, setEdges, nodes]
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      const handles = new Set(
        deleted.map((e) => e.sourceHandle).filter((h): h is string => !!h)
      );
      if (handles.size === 0) return;

      setNodes((nds) =>
        nds.map((n) => {
          const data = n.data as BotNodeData;
          const options = (data.options || []).map((o) =>
            handles.has(o.id) ? { ...o, nextNodeId: null } : o
          );
          return { ...n, data: { ...data, options } };
        })
      );
      setFlowData((list) =>
        list.map((n) => ({
          ...n,
          options: (n.options || []).map((o) =>
            handles.has(o.id) ? { ...o, nextNodeId: null } : o
          ),
        }))
      );
      setMsg("Link removed. Click Save flow to keep the change.");
    },
    [setNodes]
  );

  const addMessage = () => {
    const id = uid("node");
    let positionX = 200;
    let positionY = 200;
    if (rfInstance.current?.screenToFlowPosition) {
      const center = rfInstance.current.screenToFlowPosition({
        x: typeof window !== "undefined" ? window.innerWidth / 2 : 400,
        y: typeof window !== "undefined" ? window.innerHeight / 2 : 300,
      });
      positionX = center.x - 130;
      positionY = center.y - 80;
    } else {
      positionX = 120 + Math.random() * 200;
      positionY = 180 + Math.random() * 160;
    }
    const node: FlowNode = {
      id,
      title: "New message",
      body: "",
      isWelcome: false,
      positionX,
      positionY,
      options: [],
    };
    setFlowData((list) => [...list, node]);
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "message",
        position: { x: node.positionX, y: node.positionY },
        data: {
          title: node.title,
          body: node.body,
          isWelcome: false,
          options: [],
          onChange: patchNode,
          onDelete: deleteNode,
          onAddOption: addOption,
        },
      },
    ]);
  };

  const updateListNode = (id: string, patch: Partial<FlowNode>) => {
    setFlowData((list) => list.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const updateListOption = (nodeId: string, optIndex: number, patch: Partial<BotOption>) => {
    setFlowData((list) =>
      list.map((n) => {
        if (n.id !== nodeId) return n;
        const options = [...n.options];
        options[optIndex] = { ...options[optIndex], ...patch };
        return { ...n, options };
      })
    );
  };

  const collectPayload = () => {
    return flowData.map((n) => {
      const rf = nodes.find((x) => x.id === n.id);
      const data = rf ? (rf.data as BotNodeData) : null;
      const options = (data?.options || n.options || []).map((o) => {
        const edge = edges.find((e) => e.source === n.id && e.sourceHandle === o.id);
        let nextNodeId: string | null = o.nextNodeId || null;
        if (edge) {
          nextNodeId = edge.target;
        } else if (o.action === "next" || o.action === "next_url") {
          if (mode === "flow") nextNodeId = null;
        }
        return {
          ...o,
          nextNodeId,
        };
      });
      return {
        id: n.id,
        title: data?.title ?? n.title,
        body: data?.body ?? n.body,
        isWelcome: n.isWelcome,
        positionX: rf?.position.x ?? n.positionX,
        positionY: rf?.position.y ?? n.positionY,
        options,
      };
    });
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const payload = { nodes: collectPayload() };
      setFlowData(
        payload.nodes.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          isWelcome: !!n.isWelcome,
          positionX: n.positionX,
          positionY: n.positionY,
          options: n.options,
        }))
      );
      const res = await fetch("/api/bot/flow", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = err.detail ? ` — ${err.detail}` : "";
        setMsg((err.error || "Save failed") + detail + " (check Vercel logs / DATABASE_URL)");
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
            Welcome → options → responses. Switch editor style anytime.
          </p>
        </div>

        <div className="flex rounded-xl border border-border p-0.5 bg-background">
          <button
            type="button"
            onClick={() => setModePersist("list")}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition",
              mode === "list"
                ? "bg-primary text-white"
                : "text-muted hover:text-white"
            )}
          >
            <ListTree className="w-3.5 h-3.5" />
            List / tree
          </button>
          <button
            type="button"
            onClick={() => setModePersist("flow")}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition",
              mode === "flow"
                ? "bg-primary text-white"
                : "text-muted hover:text-white"
            )}
          >
            <Workflow className="w-3.5 h-3.5" />
            Flowchart
          </button>
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

      {mode === "flow" ? (
        <>
          <div className="flex-1 min-h-0">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onEdgesDelete={onEdgesDelete}
              onConnect={onConnect}
              onInit={(instance) => {
                rfInstance.current = instance;
              }}
              isValidConnection={(c) =>
                !!c.source && !!c.target && c.source !== c.target
              }
              nodeTypes={nodeTypes}
              nodesConnectable={true}
              nodesDraggable={true}
              elementsSelectable={true}
              deleteKeyCode={["Backspace", "Delete"]}
              fitView
              colorMode="dark"
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{
                markerEnd: { type: MarkerType.ArrowClosed, color: "#a5b4fc" },
                style: { stroke: "#a5b4fc", strokeWidth: 2 },
              }}
            >
              <Background gap={18} size={1} color="#ffffff10" />
              <Controls />
              <MiniMap
                nodeColor={(n) =>
                  (n.data as BotNodeData).isWelcome ? "#22d3ee" : "#6366f1"
                }
                maskColor="#0a0a12cc"
              />
            </ReactFlow>
          </div>
          <div className="border-t border-border px-4 py-2 text-[11px] text-muted shrink-0 flex flex-wrap gap-4">
            <span>
              <strong className="text-accent">Welcome</strong> is the first message
            </span>
            <span>Drag cyan bottom handle → drop on purple top handle of another card</span>
            <span>
              Page path e.g. <code className="text-indigo-300">/selling</code>
            </span>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            <p className="text-xs text-muted">
              Simple list editor. Same data as the flowchart — switch modes anytime, then Save.
            </p>
            {flowData.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "bg-card border rounded-2xl p-4 space-y-3",
                  n.isWelcome ? "border-accent/50" : "border-border"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-accent">
                    {n.isWelcome ? "Welcome (entry)" : n.title || "Message"}
                  </span>
                  {!n.isWelcome && (
                    <button
                      type="button"
                      onClick={() => deleteNode(n.id)}
                      className="text-xs text-red-400 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                {!n.isWelcome && (
                  <input
                    value={n.title}
                    onChange={(e) => updateListNode(n.id, { title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none"
                    placeholder="Admin title"
                  />
                )}

                <textarea
                  value={n.body}
                  onChange={(e) => updateListNode(n.id, { body: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none resize-none"
                  placeholder="Bot message shown to visitor..."
                />

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted">Options</p>
                  {n.options.map((opt, i) => (
                    <div
                      key={opt.id}
                      className="border border-border/60 rounded-xl p-3 space-y-2 bg-background/40"
                    >
                      <input
                        value={opt.label}
                        onChange={(e) =>
                          updateListOption(n.id, i, { label: e.target.value })
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm outline-none"
                        placeholder="Button label"
                      />
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={opt.action}
                          onChange={(e) =>
                            updateListOption(n.id, i, {
                              action: e.target.value as BotOption["action"],
                            })
                          }
                          className="px-2 py-1.5 rounded-lg bg-card border border-border text-sm outline-none"
                        >
                          <option value="next">Go to next message</option>
                          <option value="url">Open website page</option>
                          <option value="human">Talk to human agent</option>
                          <option value="next_url">Next message + page link</option>
                        </select>
                        {(opt.action === "next" || opt.action === "next_url") && (
                          <select
                            value={opt.nextNodeId || ""}
                            onChange={(e) =>
                              updateListOption(n.id, i, {
                                nextNodeId: e.target.value || null,
                              })
                            }
                            className="px-2 py-1.5 rounded-lg bg-card border border-border text-sm outline-none"
                          >
                            <option value="">— Select next message —</option>
                            {flowData
                              .filter((x) => x.id !== n.id)
                              .map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.isWelcome ? "Welcome" : x.title || x.id}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                      {(opt.action === "url" || opt.action === "next_url") && (
                        <input
                          value={opt.url || ""}
                          onChange={(e) =>
                            updateListOption(n.id, i, { url: e.target.value })
                          }
                          className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm outline-none"
                          placeholder="/selling or https://..."
                        />
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent("nexus265-bot-suggest", {
                                detail: {
                                  nodeId: n.id,
                                  optionId: opt.id,
                                  label: opt.label,
                                },
                              })
                            );
                          }}
                          className="text-xs text-indigo-300"
                        >
                          Suggest response
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const options = n.options.filter((_, j) => j !== i);
                            updateListNode(n.id, { options });
                          }}
                          className="text-xs text-red-400"
                        >
                          Remove option
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(n.id)}
                    className="w-full text-xs py-2 rounded-lg border border-dashed border-border text-muted hover:text-white hover:border-primary/50"
                  >
                    + Add option
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
