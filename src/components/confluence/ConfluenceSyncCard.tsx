"use client";

interface ConfluenceSyncCardProps {
  flowId: string;
  sync?: {
    confluenceSpaceKey: string;
    confluencePageId: string | null;
    lastSyncedAt: string | null;
    lastSyncStatus: string;
    autoSync: boolean;
  } | null;
  isConnected: boolean;
}

export default function ConfluenceSyncCard({ flowId, sync, isConnected }: ConfluenceSyncCardProps) {
  const handleSync = async () => {
    await fetch(`/api/flows/${flowId}/confluence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync" }),
    });
    window.location.reload();
  };

  const handleDisconnect = async () => {
    await fetch(`/api/flows/${flowId}/confluence`, { method: "DELETE" });
    window.location.reload();
  };

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.53.87a1.48 1.48 0 0 0-.95 0L3.24 3.73a.48.48 0 0 0 0 .9l7.34 2.86a1.48 1.48 0 0 0 .95 0l7.34-2.86a.48.48 0 0 0 0-.9z" />
              <path d="M12.48 19.13a1.48 1.48 0 0 1-.95 0L3.24 16.27a.48.48 0 0 1 0-.9l2.1-.82L12 17.01l6.66-2.46 2.1.82a.48.48 0 0 1 0 .9z" />
              <path d="M12.48 14.63a1.48 1.48 0 0 1-.95 0L3.24 11.77a.48.48 0 0 1 0-.9l2.1-.82L12 12.51l6.66-2.46 2.1.82a.48.48 0 0 1 0 .9z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-white">Confluence</h4>
            <p className="text-xs text-white/40">Not connected</p>
          </div>
        </div>
        <a
          href="/api/integrations/confluence/connect"
          className="inline-flex px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all"
        >
          Connect Confluence
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-white">Confluence</h4>
            <p className="text-xs text-emerald-400">Connected</p>
          </div>
        </div>
        {sync && (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
            sync.lastSyncStatus === "SUCCESS"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : sync.lastSyncStatus === "FAILED"
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}>
            {sync.lastSyncStatus}
          </span>
        )}
      </div>

      {sync?.lastSyncedAt && (
        <p className="text-xs text-white/40 mb-4">
          Last synced: {new Date(sync.lastSyncedAt).toLocaleString()}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSync}
          className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all"
        >
          Sync Now
        </button>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 text-sm font-medium rounded-xl border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition-all"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
