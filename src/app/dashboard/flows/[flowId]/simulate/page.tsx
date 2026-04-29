"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import SimulatorInputForm from "@/components/simulator/SimulatorInputForm";
import SimulationResult from "@/components/simulator/SimulationResult";
import SimulationHistory from "@/components/simulator/SimulationHistory";

export default function SimulatorPage() {
  const { flowId } = useParams() as { flowId: string };
  const [flow, setFlow] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("simulate");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/flows/${flowId}`)
      .then(res => res.json())
      .then(data => setFlow(data.flow));
  }, [flowId]);

  const handleRun = async (input: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/flows/${flowId}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/flows/${flowId}/analyze`, { method: "POST" });
      const data = await res.json();
      alert(`Health Check Complete!\nCritical Issues: ${data.criticalCount}\nTotal Issues: ${data.issueCount}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-[#0a0a0a] text-white overflow-hidden">
      <div className="w-1/3 border-r border-white/10 flex flex-col bg-[#0f0f13]">
        <div className="flex border-b border-white/10">
          <button 
            className={`flex-1 py-4 font-medium transition-colors ${activeTab === "simulate" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-white/50 hover:text-white"}`}
            onClick={() => setActiveTab("simulate")}
          >
            Simulate
          </button>
          <button 
            className={`flex-1 py-4 font-medium transition-colors ${activeTab === "history" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-white/50 hover:text-white"}`}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "simulate" && (
            <div className="space-y-6">
              <SimulatorInputForm onRun={handleRun} loading={loading} />
              <button 
                onClick={runHealthCheck}
                disabled={loading}
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/70 transition-colors"
              >
                Run Health Check (Stateless)
              </button>
              {result && <SimulationResult result={result} />}
            </div>
          )}
          {activeTab === "history" && (
            <SimulationHistory flowId={flowId} onSelect={(r: any) => { setResult({ result: r }); setActiveTab("simulate"); }} />
          )}
        </div>
      </div>
      <div className="w-2/3 bg-black relative">
        {flow ? (
          <FlowCanvas flow={flow} highlightPath={result?.result?.resultPath} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/40">Loading flow canvas...</div>
        )}
      </div>
    </div>
  );
}
