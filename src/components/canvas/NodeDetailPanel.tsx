"use client";

import { X, Type, Hash, FileJson } from "lucide-react";
import type { Node } from "reactflow";
import { Separator } from "@/components/ui/separator";

const typeColors: Record<string, string> = {
  START: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  MENU: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  PROMPT: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  CONDITION: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  TRANSFER: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  API_CALL: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  QUEUE: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  HANGUP: "text-red-400 bg-red-500/10 border-red-500/20",
  VOICEMAIL: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  UNKNOWN: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
};

interface Props {
  node: Node;
  onClose: () => void;
}

export function NodeDetailPanel({ node, onClose }: Props) {
  const metadata = (node.data?.metadata || {}) as Record<string, unknown>;
  const nodeType = node.type || "UNKNOWN";
  const colorClass = typeColors[nodeType] || typeColors.UNKNOWN;

  return (
    <div className="w-[320px] shrink-0 animate-fade-in border-l border-border bg-card overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Node Details</h3>
        <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        {/* Type badge */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</p>
          <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${colorClass}`}>
            {nodeType}
          </span>
        </div>

        {/* Label */}
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Type className="h-3 w-3" /> Label
          </p>
          <p className="text-sm text-foreground">{node.data?.label || "—"}</p>
        </div>

        {/* Node ID */}
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Hash className="h-3 w-3" /> Node ID
          </p>
          <code className="block rounded bg-secondary px-2 py-1 text-xs text-muted-foreground break-all">{node.id}</code>
        </div>

        {/* Audio Prompt */}
        {node.data?.audioPrompt && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Audio Prompt</p>
            <p className="text-sm text-foreground">🔊 {node.data.audioPrompt}</p>
          </div>
        )}

        <Separator />

        {/* Raw Metadata */}
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <FileJson className="h-3 w-3" /> Raw Metadata
          </p>
          <pre className="max-h-[300px] overflow-auto rounded-lg bg-secondary/50 p-3 text-[11px] text-muted-foreground">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>

        {/* Position */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Position</p>
          <p className="text-xs text-muted-foreground">
            x: {Math.round(node.position.x)}, y: {Math.round(node.position.y)}
          </p>
        </div>
      </div>
    </div>
  );
}
