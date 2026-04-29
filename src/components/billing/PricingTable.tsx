"use client";

const features = [
  { name: "Flows", free: "1", pro: "∞", enterprise: "∞" },
  { name: "Team members", free: "3", pro: "10", enterprise: "∞" },
  { name: "Version history", free: "5/flow", pro: "∞", enterprise: "∞" },
  { name: "Simulations/mo", free: "10", pro: "∞", enterprise: "∞" },
  { name: "Confluence sync", free: "✗", pro: "✓", enterprise: "✓" },
  { name: "HTML embed", free: "✗", pro: "✓", enterprise: "✓" },
  { name: "Export formats", free: "PDF", pro: "All", enterprise: "All" },
  { name: "API access", free: "✗", pro: "✗", enterprise: "✓" },
  { name: "Audit logs", free: "✗", pro: "✗", enterprise: "✓" },
  { name: "SSO / SAML", free: "✗", pro: "✗", enterprise: "✓" },
];

export default function PricingTable() {
  const handleUpgrade = async (plan: "PRO" | "ENTERPRISE") => {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval: "month" }),
    });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <h3 className="text-lg font-bold text-white tracking-tight">Compare Plans</h3>
        <p className="text-sm text-white/40 mt-1">Find the right plan for your team</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left p-4 text-white/50 font-medium">Feature</th>
              <th className="text-center p-4">
                <div className="text-white/80 font-semibold">Free</div>
                <div className="text-white/30 text-xs">$0</div>
              </th>
              <th className="text-center p-4 bg-indigo-500/5">
                <div className="text-indigo-400 font-semibold">Pro</div>
                <div className="text-indigo-400/50 text-xs">$99/mo</div>
              </th>
              <th className="text-center p-4">
                <div className="text-violet-400 font-semibold">Enterprise</div>
                <div className="text-violet-400/50 text-xs">$499/mo</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((f, i) => (
              <tr key={f.name} className={`border-b border-white/[0.03] ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                <td className="p-4 text-white/70 font-medium">{f.name}</td>
                <td className="p-4 text-center text-white/50">{f.free}</td>
                <td className="p-4 text-center bg-indigo-500/5">
                  <span className={f.pro === "✓" ? "text-emerald-400" : f.pro === "✗" ? "text-white/20" : "text-white/70"}>
                    {f.pro}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={f.enterprise === "✓" ? "text-emerald-400" : f.enterprise === "✗" ? "text-white/20" : "text-white/70"}>
                    {f.enterprise}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-white/5 flex gap-4 justify-center">
        <button
          onClick={() => handleUpgrade("PRO")}
          className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95"
        >
          Start Pro — $99/mo
        </button>
        <button
          onClick={() => handleUpgrade("ENTERPRISE")}
          className="px-6 py-2.5 text-sm font-semibold rounded-xl border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-all"
        >
          Contact for Enterprise
        </button>
      </div>
    </div>
  );
}
