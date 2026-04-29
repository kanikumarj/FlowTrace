"use client";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  upgradeRequired?: string;
}

export default function UpgradeModal({ isOpen, onClose, reason, upgradeRequired }: UpgradeModalProps) {
  if (!isOpen) return null;

  const handleUpgrade = async () => {
    const plan = upgradeRequired === "ENTERPRISE" ? "ENTERPRISE" : "PRO";
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval: "month" }),
    });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0f0f18] p-8 shadow-2xl shadow-black/50">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20">
            <svg className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Plan Limit Reached</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            {reason || "You've reached your current plan's limit."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpgrade}
            className="w-full py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
          >
            Upgrade to {upgradeRequired || "PRO"} →
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-medium rounded-xl border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition-all"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
