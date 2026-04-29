"use client";

import { useState } from "react";
import UpgradeModal from "@/components/billing/UpgradeModal";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowId: string;
  versions: Array<{ id: string; versionNumber: number; isActive: boolean }>;
}

export default function ExportModal({ isOpen, onClose, flowId, versions }: ExportModalProps) {
  const [format, setFormat] = useState("PDF");
  const [versionId, setVersionId] = useState(versions.find((v) => v.isActive)?.id ?? versions[0]?.id ?? "");
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<{ reason: string; plan: string } | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/flows/${flowId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, versionId, expiresInDays }),
      });

      if (res.status === 403) {
        const data = await res.json();
        setUpgradeInfo({ reason: data.error, plan: data.upgradeRequired });
        setLoading(false);
        return;
      }

      if (format === "PDF") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `flow-export.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setResult({ status: "Downloaded" });
      } else {
        const data = await res.json();
        setResult(data);
      }
    } catch {
      setResult({ error: "Export failed" });
    } finally {
      setLoading(false);
    }
  };

  const formats = [
    { value: "PDF", label: "PDF Document", icon: "📄", allPlans: true },
    { value: "HTML", label: "HTML Embed", icon: "🌐", allPlans: false },
    { value: "MARKDOWN", label: "Markdown", icon: "📝", allPlans: false },
    { value: "MERMAID", label: "Mermaid Diagram", icon: "🧜", allPlans: false },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[998] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0f0f18] shadow-2xl shadow-black/50 overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-white tracking-tight">Export Flow</h2>
            <p className="text-sm text-white/40 mt-1">Choose format and version</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {formats.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      format === f.value
                        ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="text-lg">{f.icon}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium text-white/80">{f.label}</span>
                      {!f.allPlans && (
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-full font-bold">
                          PRO
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Version Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                Version
              </label>
              <select
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Version {v.versionNumber} {v.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* HTML-specific options */}
            {format === "HTML" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                  Embed Expiry
                </label>
                <select
                  value={expiresInDays ?? "never"}
                  onChange={(e) =>
                    setExpiresInDays(e.target.value === "never" ? undefined : Number(e.target.value))
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="never">Never expires</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            )}

            {/* Result */}
            {result && !result.error && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                <p className="text-sm font-medium text-emerald-400">✓ Export complete</p>
                {result.embedUrl && (
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={result.embedUrl}
                      className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 font-mono"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(result.embedUrl!)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all"
                    >
                      Copy
                    </button>
                  </div>
                )}
                {result.content && format !== "PDF" && (
                  <button
                    onClick={() => navigator.clipboard.writeText(result.content!)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all"
                  >
                    Copy to Clipboard
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition-all"
            >
              Close
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Export"}
            </button>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={!!upgradeInfo}
        onClose={() => setUpgradeInfo(null)}
        reason={upgradeInfo?.reason}
        upgradeRequired={upgradeInfo?.plan}
      />
    </>
  );
}
