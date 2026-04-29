export default function SimulationResult({ result }: any) {
  const r = result.result;
  const issues = r.flaggedIssues || [];
  
  const outcomeColors: any = {
    REACHED_QUEUE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    HANGUP: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    DEAD_END: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    LOOP_DETECTED: "bg-rose-600/10 text-rose-500 border-rose-600/20",
    ERROR: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`p-5 rounded-2xl border ${outcomeColors[r.resultOutcome] || "bg-white/5 border-white/10"} flex items-center justify-between backdrop-blur-sm`}>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1 opacity-80">Outcome</p>
          <p className="font-semibold text-lg">{result.outcomeLabel || r.resultOutcome}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wider mb-1 opacity-80">Steps</p>
          <p className="font-semibold text-lg">{r.totalSteps}</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider">Path Trace</h4>
        <div className="space-y-2">
          {r.resultPath.map((nodeId: string, idx: number) => (
            <div key={idx} className="flex gap-4 text-sm bg-white/[0.02] p-3 rounded-lg border border-white/5">
              <span className="text-white/30 font-mono w-6 text-right shrink-0">{idx + 1}.</span>
              <span className="text-white/90 font-medium">{nodeId}</span>
            </div>
          ))}
        </div>
      </div>

      {issues.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wider flex items-center gap-2">
            Issues <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{issues.length}</span>
          </h4>
          <div className="space-y-3">
            {issues.map((issue: any, idx: number) => (
              <div key={idx} className={`p-4 rounded-xl border text-sm ${issue.severity === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
                <span className="font-bold tracking-wide uppercase text-xs opacity-80 mr-2">{issue.type}</span> 
                {issue.label || issue.message || `Node ${issue.nodeId}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
