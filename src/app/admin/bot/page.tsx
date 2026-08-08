"use client";

import { useCallback, useEffect, useState } from "react";
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
              <div className="flex justify-between items-center gap-1 flex-wrap">
                <span className="text-[10px] text-muted flex items-center gap-1">
                  {opt.action === "human" && <UserRound className="w-3 h-3" />}
                  {(opt.action === "url" || opt.action === "next_url") && (
                    <ExternalLink className="w-3 h-3" />
                  )}
                  {opt.action === "next" || opt.action === "next_url"
                    ? "Drag handle →"
                    : ""}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="text-[10px] text-indigo-300"
                    title="Suggest a follow-up message from this option label"
                    onClick={() => {
                      // Store suggestion request on window for parent to handle via custom event
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
                    className="text-[10px] text-red-400"
                    onClick={() => {
                      const options = d.options.filter((_, j) => j !== i);
                      d.onChange?.(id, { options });
                    }}
                  >
                    Remove
                  </button>
                </div>
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
  const [mode, setMode] = useState<EditorMode>("list");
  const [flowData, setFlowData] = useState<FlowNode[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Persist mode preference
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

  const applyGraphFromFlowData = useCallback(
    (dataNodes: FlowNode[]) => {
      const graphNodes: Node[] = dataNodes.map((n) => ({
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
              label: o.label,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: "#6366f1" },
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

  // Flowchart "Suggest" → create/fill next message from option label
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
                      action:
                        o.action === "url"
                          ? "next_url"
                          : o.action === "human"
                            ? "human"
                            : "next",
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


  // When switching to flow, rebuild canvas from flowData + current RF positions if any
  useEffect(() => {
    if (!loaded || mode !== "flow") return;
    // Merge positions from existing RF nodes when possible
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
      if (!connection.source || !connection.target || !connection.sourceHandle) return;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== connection.source) return n;
          const data = n.data as BotNodeData;
          const options = data.options.map((o) =>
            o.id === connection.sourceHandle
              ? {
                  ...o,
                  nextNodeId: connection.target,
                  action:
                    o.action === "url"
                      ? "next_url"
                      : o.action === "human"
                        ? "human"
                        : o.action === "next_url"
                          ? "next_url"
                          : "next",
                }
              : o
          );
          return { ...n, data: { ...data, options } };
        })
      );
      setFlowData((list) =>
        list.map((n) => {
          if (n.id !== connection.source) return n;
          return {
            ...n,
            options: n.options.map((o) =>
              o.id === connection.sourceHandle
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
    const node: FlowNode = {
      id,
      title: "New message",
      body: "",
      isWelcome: false,
      positionX: 120 + Math.random() * 200,
      positionY: 180 + Math.random() * 160,
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
    // Prefer RF positions when available
    return flowData.map((n) => {
      const rf = nodes.find((x) => x.id === n.id);
      const data = rf ? (rf.data as BotNodeData) : null;
      const options = (data?.options || n.options || []).map((o) => {
        const edge = edges.find((e) => e.source === n.id && e.sourceHandle === o.id);
        return {
          ...o,
          nextNodeId: edge?.target || o.nextNodeId || null,
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
      // Keep flowData in sync before save
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
            Welcome → options → responses. Switch editor style anytime.
          </p>
        </div>

        {/* Mode switch */}
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
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              colorMode="dark"
              proOptions={{ hideAttribution: true }}
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
            <span>Add options → choose action → drag handle to next message</span>
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
                      Delete
                    </button>
                  )}
                </div>
                {!n.isWelcome && (
                  <input
                    value={n.title}
                    onChange={(e) => updateListNode(n.id, { title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary"
                    placeholder="Admin title"
                  />
                )}
                <textarea
                  value={n.body}
                  onChange={(e) => updateListNode(n.id, { body: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary resize-none"
                  placeholder="Bot message..."
                />
                <div className="space-y-2">
                  <p className="text-xs text-muted font-medium">Options</p>
                  {n.options.map((opt, i) => (
                    <div
                      key={opt.id}
                      className="border border-border rounded-xl p-3 space-y-2 bg-background/40"
                    >
                      <input
                        value={opt.label}
                        onChange={(e) =>
                          updateListOption(n.id, i, { label: e.target.value })
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm outline-none"
                        placeholder="Button label"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                            const suggestion = suggestResponseFromOption(opt.label);
                            // If linked to a next node, fill that node's body; else create one
                            if (opt.nextNodeId) {
                              updateListNode(opt.nextNodeId, {
                                body: suggestion,
                                title: suggestTitleFromOption(opt.label),
                              });
                              setMsg("Suggested text applied to the linked message.");
                            } else {
                              const id = uid("node");
                              const node: FlowNode = {
                                id,
                                title: suggestTitleFromOption(opt.label),
                                body: suggestion,
                                isWelcome: false,
                                positionX: 120 + Math.random() * 200,
                                positionY: 180 + Math.random() * 160,
                                options: [],
                              };
                              setFlowData((list) => {
                                const next = [...list, node];
                                return next.map((x) => {
                                  if (x.id !== n.id) return x;
                                  const options = [...x.options];
                                  options[i] = {
                                    ...options[i],
                                    nextNodeId: id,
                                    action:
                                      options[i].action === "url"
                                        ? "next_url"
                                        : options[i].action === "human"
                                          ? "human"
                                          : "next",
                                  };
                                  return { ...x, options };
                                });
                              });
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
                              setMsg("Created a follow-up message from this option's wording.");
                            }
                          }}
                          className="text-xs px-2 py-1 rounded-lg border border-primary/40 text-indigo-200 hover:bg-primary/15"
                        >
                          Suggest response
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateListNode(n.id, {
                              options: n.options.filter((_, j) => j !== i),
                            })
                          }
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
                    className="text-xs px-3 py-2 rounded-lg border border-dashed border-border text-muted hover:text-white w-full"
                  >
                    + Add option
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addMessage}
              className="w-full btn-outline text-sm justify-center py-3"
            >
              <Plus className="w-4 h-4" />
              Add message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
