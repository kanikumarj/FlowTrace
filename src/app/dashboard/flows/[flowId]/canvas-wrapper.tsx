"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { UploadFlowModal } from "@/components/flows/UploadFlowModal";
import { ArrowLeft, RefreshCw, Download, PlayCircle, Hash, GitBranch, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const platformLabel: Record<string, string> = {
  AMAZON_CONNECT: "Amazon Connect",
  CISCO_UCCX: "Cisco UCCX",
  GENESYS: "Genesys Cloud",
};

interface FlowData {
  id: string;
  name: string;
  platform: string;
  status: string;
  nodeCount: number;
  createdBy: { name: string | null; email: string };
  nodes: Array<{
    nodeId: string;
    type: string;
    label: string;
    metadata: Record<string, unknown>;
    positionX: number;
    positionY: number;
  }>;
  edges: Array<{
    sourceNodeId: string;
    targetNodeId: string;
    label: string;
    condition?: string | null;
  }>;
}

export function FlowCanvasWrapper({ flow }: { flow: FlowData }) {
  const router = useRouter();
  const [flowName, setFlowName] = useState(flow.name);
  const [isEditing, setIsEditing] = useState(false);
  const [reimportOpen, setReimportOpen] = useState(false);

  const saveName = useCallback(async () => {
    setIsEditing(false);
    if (flowName.trim() === flow.name) return;
    try {
      await fetch(`/api/flows/${flow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: flowName.trim() }),
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to save name", err);
      setFlowName(flow.name);
    }
  }, [flowName, flow.name, flow.id, router]);

  if (flow.status === "ERROR" || flow.nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold">Flow Error</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {flow.nodes.length === 0
            ? "This flow has zero nodes. The file may be empty or in an unsupported format."
            : "This flow encountered an error during parsing."}
        </p>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" asChild><Link href="/dashboard/flows"><ArrowLeft className="mr-2 h-4 w-4" />Back to Flows</Link></Button>
          <Button onClick={() => setReimportOpen(true)}><RefreshCw className="mr-2 h-4 w-4" />Re-import</Button>
        </div>
        <UploadFlowModal open={reimportOpen} onClose={() => setReimportOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/dashboard/flows"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>

          {isEditing ? (
            <input
              autoFocus
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="rounded border border-primary bg-transparent px-2 py-0.5 text-sm font-semibold text-foreground outline-none"
            />
          ) : (
            <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-foreground hover:text-primary transition-colors" title="Click to edit">
              {flowName}
            </button>
          )}

          <span className="rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {platformLabel[flow.platform] || flow.platform}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
            <GitBranch className="h-3 w-3" />{flow.nodes.length} nodes
          </span>
          <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
            <Hash className="h-3 w-3" />{flow.edges.length} edges
          </span>
          <Button variant="outline" size="sm" onClick={() => setReimportOpen(true)}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Re-import
          </Button>
          <Button variant="outline" size="sm" disabled title="Coming in Phase 3">
            <PlayCircle className="mr-1.5 h-3.5 w-3.5" />Simulate
          </Button>
          <Button variant="outline" size="sm" disabled title="Coming in Phase 4">
            <Download className="mr-1.5 h-3.5 w-3.5" />Export
          </Button>
        </div>
      </div>

      {/* Warning banner for zero-node edge case */}
      {flow.nodeCount === 0 && (
        <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />This flow has no parseable nodes.
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1">
        <FlowCanvas flow={flow} />
      </div>

      <UploadFlowModal open={reimportOpen} onClose={() => setReimportOpen(false)} />
    </div>
  );
}
