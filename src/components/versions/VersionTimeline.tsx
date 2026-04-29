export default function VersionTimeline({ versions, selectedId, onSelect }: any) {
  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
      {versions.map((v: any) => (
        <div 
          key={v.id} 
          onClick={() => onSelect(v.id)}
          className={`relative z-10 p-5 rounded-2xl cursor-pointer border transition-all duration-300 backdrop-blur-md ${selectedId === v.id ? "bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]" : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"}`}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg tracking-tight text-white/90">{v.label || `Version ${v.versionNumber}`}</h3>
            {v.isActive && <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium">Active</span>}
          </div>
          <p className="text-sm text-white/50 mb-1">Imported by <span className="text-white/70">{v.importedBy?.name || "System"}</span></p>
          <p className="text-xs text-white/40">{new Date(v.importedAt).toLocaleString()}</p>
          <div className="mt-4 flex gap-2 text-xs">
            <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-white/70">{v.nodeCount} nodes</span>
            <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-white/70">{v.edgeCount} edges</span>
          </div>
        </div>
      ))}
    </div>
  );
}
