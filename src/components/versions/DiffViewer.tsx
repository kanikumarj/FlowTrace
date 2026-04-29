export default function DiffViewer({ diff }: { diff: any }) {
  if (!diff || (!diff.nodes && !diff.edges)) {
    return <p className="text-white/40 text-center py-10">No diff available.</p>;
  }

  const renderSection = (title: string, icon: string, items: any[], type: "added" | "removed" | "modified") => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="mb-8">
        <h4 className="font-semibold text-sm text-white/50 mb-3 uppercase tracking-wider">{icon} {title} ({items.length})</h4>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10 text-sm backdrop-blur-sm transition-all hover:bg-white/10">
              <div className="flex justify-between items-start">
                <span className="font-medium text-white/90">{item.label || item.id || `${item.source} -> ${item.target}`}</span>
                {item.type && <span className="text-xs bg-white/10 px-2 py-1 rounded-md text-white/70">{item.type}</span>}
              </div>
              
              {type === "modified" && item.changes && (
                <div className="mt-3 pl-3 border-l-2 border-amber-500/50 space-y-2">
                  {item.changes.map((change: any, idx: number) => (
                    <div key={idx} className="text-xs grid grid-cols-[1fr_2fr_2fr] gap-3 items-center">
                      <span className="text-white/40 font-mono">{change.field}:</span>
                      <span className="text-rose-400/80 line-through truncate px-2 py-1 bg-rose-500/10 rounded">{JSON.stringify(change.before)}</span>
                      <span className="text-emerald-400/80 truncate px-2 py-1 bg-emerald-500/10 rounded">→ {JSON.stringify(change.after)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
        <h3 className="text-xl font-semibold border-b border-white/10 pb-4 mb-6 tracking-tight">Nodes</h3>
        {renderSection("Added", "➕", diff.nodes?.added, "added")}
        {renderSection("Removed", "➖", diff.nodes?.removed, "removed")}
        {renderSection("Modified", "✏️", diff.nodes?.modified, "modified")}
        {(!diff.nodes?.added?.length && !diff.nodes?.removed?.length && !diff.nodes?.modified?.length) && (
          <p className="text-sm text-white/40 py-4 text-center">No node changes</p>
        )}
      </div>

      <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
        <h3 className="text-xl font-semibold border-b border-white/10 pb-4 mb-6 tracking-tight">Edges</h3>
        {renderSection("Added", "➕", diff.edges?.added, "added")}
        {renderSection("Removed", "➖", diff.edges?.removed, "removed")}
        {renderSection("Modified", "✏️", diff.edges?.modified, "modified")}
        {(!diff.edges?.added?.length && !diff.edges?.removed?.length && !diff.edges?.modified?.length) && (
          <p className="text-sm text-white/40 py-4 text-center">No edge changes</p>
        )}
      </div>
    </div>
  );
}
