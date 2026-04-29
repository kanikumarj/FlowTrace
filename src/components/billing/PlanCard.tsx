"use client";

import { PLAN_LIMITS, PLAN_DISPLAY, type PlanTier } from "@/lib/billing/plans";

interface PlanCardProps {
  plan: PlanTier;
  status: string | null;
  planExpiresAt: string | null;
}

export default function PlanCard({ plan, status, planExpiresAt }: PlanCardProps) {
  const display = PLAN_DISPLAY[plan];
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PAST_DUE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    CANCELED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    TRIALING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  const handleManageBilling = async () => {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.portalUrl) window.location.href = data.portalUrl;
  };

  const handleUpgrade = async (targetPlan: "PRO" | "ENTERPRISE") => {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: targetPlan, interval: "month" }),
    });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-sm">
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl" />

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-2xl font-bold tracking-tight text-white">{display.name}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${plan === "FREE" ? "bg-white/5 border-white/10 text-white/60" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"}`}>
              {plan}
            </span>
          </div>
          <p className="text-white/50 text-sm">
            {plan === "FREE" ? "Free forever" : `${display.priceLabel} per workspace`}
          </p>
        </div>
        {status && (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusColors[status] || "bg-white/5 border-white/10 text-white/50"}`}>
            {status}
          </span>
        )}
      </div>

      {planExpiresAt && (
        <p className="text-xs text-white/40 mb-4">
          Renews: {new Date(planExpiresAt).toLocaleDateString()}
        </p>
      )}

      <div className="flex gap-3">
        {plan !== "FREE" && (
          <button
            onClick={handleManageBilling}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition-all"
          >
            Manage Billing
          </button>
        )}
        {plan === "FREE" && (
          <button
            onClick={() => handleUpgrade("PRO")}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95"
          >
            Upgrade to Pro — $99/mo
          </button>
        )}
        {plan === "PRO" && (
          <button
            onClick={() => handleUpgrade("ENTERPRISE")}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all active:scale-95"
          >
            Upgrade to Enterprise
          </button>
        )}
      </div>
    </div>
  );
}
