"use client";

import { useEffect, useState } from "react";
import PlanCard from "@/components/billing/PlanCard";
import UsageStats from "@/components/billing/UsageStats";
import PricingTable from "@/components/billing/PricingTable";

interface BillingData {
  plan: string;
  status: string | null;
  planExpiresAt: string | null;
  usage: Record<string, { current: number; limit: number }>;
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing & Plan</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your subscription and monitor usage</p>
      </div>

      {data && (
        <>
          <PlanCard
            plan={data.plan as "FREE" | "PRO" | "ENTERPRISE"}
            status={data.status}
            planExpiresAt={data.planExpiresAt}
          />
          <UsageStats usage={data.usage} />
          {data.plan === "FREE" && <PricingTable />}
        </>
      )}
    </div>
  );
}
