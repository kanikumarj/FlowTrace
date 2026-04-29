import { useEffect, useState } from "react";

export default function SimulationHistory({ flowId, onSelect }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/flows/${flowId}/simulate/history`)
      .then(res => res.json())
      .then(data => {
        setHistory(data.history || []);
        setLoading(false);
      });
  }, [flowId]);

  if (loading) return <div className="text-white/40 animate-pulse p-4">Loading history...</div>;
  if (history.length === 0) return <div className="text-white/40 p-4 text-center">No simulation history yet.</div>;

  const outcomeColors: any = {
    REACHED_QUEUE: "text-emerald-400",
    HANGUP: "text-rose-400",
    DEAD_END: "text-amber-400",
    LOOP_DETECTED: "text-rose-500",
    ERROR: "text-red-400",
  };

  return (
    <div className="space-y-3">
      {history.map(run => (
        <div 
          key={run.id}
          onClick={() => onSelect(run)}
          className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-sm"
        >
          <div className="flex justify-between items-center mb-3">
            <span className={`text-sm font-bold tracking-wide ${outcomeColors[run.resultOutcome] || "text-white"}`}>{run.resultOutcome}</span>
            <span className="text-xs text-white/40 font-mono">{new Date(run.createdAt).toLocaleString()}</span>
          </div>
          <div className="text-xs text-white/60 flex flex-wrap gap-x-4 gap-y-2">
            <span className="bg-black/30 px-2 py-1 rounded">Caller: {run.inputCallerType}</span>
            <span className="bg-black/30 px-2 py-1 rounded">Time: {run.inputTime}</span>
            <span className="bg-black/30 px-2 py-1 rounded">Input: {run.inputDnis || "None"}</span>
            <span className="bg-black/30 px-2 py-1 rounded">Steps: {run.totalSteps}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
