"use client";

import { useEffect, useState } from "react";

interface ExportHistoryProps {
  flowId: string;
}

export default function ExportHistory({ flowId }: ExportHistoryProps) {
  const [exports, setExports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/flows/${flowId}/export/history`)
      .then((r) => r.json())
      .then((d) => { setExports(d.exports || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [flowId]);

  if (loading) return <div className="animate-pulse text-white/30 text-sm p-4">Loading exports...</div>;
  if (exports.length === 0) return <div className="text-white/30 text-sm p-4 text-center">No exports yet</div>;

  const formatIcons: Record<string, string> = {
    PDF: "📄", HTML: "🌐", MARKDOWN: "📝", MERMAID: "🧜",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Export History</h3>
      </div>
      <div className="divide-y divide-white/[0.03]">
        {exports.map((exp) => (
          <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-lg">{formatIcons[exp.format] || "📁"}</span>
              <div>
                <div className="text-sm font-medium text-white/80">
                  {exp.format} — v{exp.version?.versionNumber}
                </div>
                <div className="text-xs text-white/40">
                  by {exp.exportedByUser?.name || "User"} · {new Date(exp.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            {exp.fileUrl && exp.format === "HTML" && (
              <button
                onClick={() => navigator.clipboard.writeText(exp.fileUrl)}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all"
              >
                Copy URL
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
