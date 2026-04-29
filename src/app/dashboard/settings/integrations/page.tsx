"use client";

import { useEffect, useState } from "react";

export default function IntegrationsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if confluence is connected by trying to list spaces
    fetch("/api/integrations/confluence/spaces")
      .then((r) => {
        if (r.ok) {
          setIsConnected(true);
          return r.json();
        }
        return null;
      })
      .then((data) => {
        if (data?.spaces) setSiteUrl("Connected");
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Check URL params for success/error
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setIsConnected(true);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect external tools to your workspace</p>
      </div>

      {/* Confluence Integration Card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <svg className="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.53.87a1.48 1.48 0 0 0-.95 0L3.24 3.73a.48.48 0 0 0 0 .9l7.34 2.86a1.48 1.48 0 0 0 .95 0l7.34-2.86a.48.48 0 0 0 0-.9z" />
                <path d="M12.48 19.13a1.48 1.48 0 0 1-.95 0L3.24 16.27a.48.48 0 0 1 0-.9l2.1-.82L12 17.01l6.66-2.46 2.1.82a.48.48 0 0 1 0 .9z" />
                <path d="M12.48 14.63a1.48 1.48 0 0 1-.95 0L3.24 11.77a.48.48 0 0 1 0-.9l2.1-.82L12 12.51l6.66-2.46 2.1.82a.48.48 0 0 1 0 .9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Confluence</h3>
              <p className="text-sm text-white/50">
                Auto-sync flow documentation to Confluence pages
              </p>
            </div>
          </div>

          {isConnected ? (
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              Connected
            </span>
          ) : (
            <span className="bg-white/5 border border-white/10 text-white/40 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              Not Connected
            </span>
          )}
        </div>

        {isConnected ? (
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              Your workspace is connected to Confluence. Configure sync per-flow in the flow settings.
            </p>
            <div className="flex gap-3">
              <a
                href="/api/integrations/confluence/connect"
                className="px-4 py-2 text-sm font-medium rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition-all"
              >
                Reconnect
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-white/50">
              Connect your Atlassian account to enable automatic documentation sync to Confluence.
              Requires PRO plan or higher.
            </p>
            <a
              href="/api/integrations/confluence/connect"
              className="inline-flex px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95"
            >
              Connect Confluence
            </a>
          </div>
        )}
      </div>

      {/* API Keys (Enterprise Only) */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 opacity-60">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">
            <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">API Keys</h3>
            <p className="text-sm text-white/50">Programmatic access to FlowTrace data</p>
          </div>
        </div>
        <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
          Enterprise Only
        </span>
      </div>
    </div>
  );
}
