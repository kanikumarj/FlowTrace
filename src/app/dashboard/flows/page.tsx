"use client";

import { useState, useEffect } from "react";
import { Upload, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowCard } from "@/components/flows/FlowCard";
import { UploadFlowModal } from "@/components/flows/UploadFlowModal";

interface FlowSummary {
  id: string;
  name: string;
  platform: string;
  nodeCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string | null; email: string };
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    async function loadFlows() {
      try {
        const res = await fetch("/api/flows");
        const data = await res.json();
        setFlows(data.flows || []);
      } catch (err) {
        console.error("Failed to load flows", err);
      } finally {
        setLoading(false);
      }
    }
    loadFlows();
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Flows</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your IVR call flow documentation</p>
        </div>
        <Button onClick={() => setUploadOpen(true)} id="upload-flow-btn">
          <Upload className="mr-2 h-4 w-4" />Upload New Flow
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[140px] animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : flows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <GitBranch className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">No flows yet</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Upload your first IVR call flow to start documenting, visualizing, and auditing your contact center architecture.
          </p>
          <Button className="mt-6" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />Upload Your First Flow
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <FlowCard key={flow.id} {...flow} />
          ))}
        </div>
      )}

      <UploadFlowModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
