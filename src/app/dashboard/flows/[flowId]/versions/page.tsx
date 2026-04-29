"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import VersionTimeline from "@/components/versions/VersionTimeline";
import DiffViewer from "@/components/versions/DiffViewer";

export default function VersionsPage() {
  const { flowId } = useParams() as { flowId: string };
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [diff, setDiff] = useState<any>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  useEffect(() => {
    fetch(`/api/flows/${flowId}/versions`)
      .then(res => res.json())
      .then(data => {
        if (data.versions) {
          setVersions(data.versions);
          if (data.versions.length > 0) setSelectedVersionId(data.versions[0].id);
        }
      });
  }, [flowId]);

  useEffect(() => {
    if (!selectedVersionId || versions.length < 2) return;
    
    const currentIndex = versions.findIndex(v => v.id === selectedVersionId);
    if (currentIndex === -1 || currentIndex === versions.length - 1) {
      setDiff(null);
      return;
    }
    const prevVersionId = versions[currentIndex + 1].id;

    setLoadingDiff(true);
    fetch(`/api/flows/${flowId}/versions/diff?from=${prevVersionId}&to=${selectedVersionId}`)
      .then(res => res.json())
      .then(data => {
        setDiff(data.diff);
      })
      .finally(() => setLoadingDiff(false));

  }, [selectedVersionId, versions, flowId]);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-[#0a0a0a] text-white overflow-hidden">
      <div className="w-1/3 border-r border-white/10 p-6 overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-6 tracking-tight">Version History</h2>
        <VersionTimeline 
          versions={versions} 
          selectedId={selectedVersionId} 
          onSelect={setSelectedVersionId} 
        />
      </div>
      <div className="w-2/3 p-8 overflow-y-auto bg-[#0f0f13]">
        <h2 className="text-2xl font-semibold mb-6 tracking-tight">Changes</h2>
        {loadingDiff ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-white/5 rounded w-full"></div>
            <div className="h-32 bg-white/5 rounded w-full"></div>
          </div>
        ) : diff ? (
          <DiffViewer diff={diff} />
        ) : (
          <div className="text-center text-white/40 py-20">
            <p className="text-lg">No changes detected between versions or no previous version to compare.</p>
          </div>
        )}
      </div>
    </div>
  );
}
