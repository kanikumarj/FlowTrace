"use client";

interface UsageItem {
  label: string;
  current: number;
  limit: number; // -1 = unlimited
}

interface UsageStatsProps {
  usage: Record<string, { current: number; limit: number }>;
}

const METRIC_LABELS: Record<string, string> = {
  FLOW_COUNT: "Flows",
  USER_COUNT: "Team Members",
  SIMULATION_RUN: "Simulations (monthly)",
  VERSION_COUNT: "Versions per Flow",
};

export default function UsageStats({ usage }: UsageStatsProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Usage</h3>
      <div className="space-y-4">
        {Object.entries(METRIC_LABELS).map(([key, label]) => {
          const data = usage[key] || { current: 0, limit: -1 };
          return (
            <UsageBar key={key} label={label} current={data.current} limit={data.limit} />
          );
        })}
      </div>
    </div>
  );
}

function UsageBar({ label, current, limit }: UsageItem) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, (current / limit) * 100);
  const isNearLimit = !isUnlimited && percentage >= 80;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-white/70 font-medium">{label}</span>
        <span className={`font-mono text-xs ${isNearLimit ? "text-amber-400" : "text-white/50"}`}>
          {current} / {isUnlimited ? "∞" : limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        {isUnlimited ? (
          <div className="h-full w-full bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 rounded-full" />
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isNearLimit
                ? "bg-gradient-to-r from-amber-500 to-rose-500"
                : "bg-gradient-to-r from-indigo-500 to-violet-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}
