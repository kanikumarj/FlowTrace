import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Volume2 } from "lucide-react";

function PromptNodeComponent({ data, selected }: NodeProps) {
  return (
    <div className={`min-w-[170px] rounded-lg border bg-slate-800/80 px-3 py-2.5 shadow-md backdrop-blur transition-all ${selected ? "border-slate-400 shadow-slate-500/20" : "border-slate-700/60"}`}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-slate-400 !bg-slate-300" />
      <div className="mb-1.5 flex items-center gap-1.5">
        <Volume2 className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Prompt</span>
      </div>
      <p className="text-xs font-medium text-slate-100 leading-snug">{data.label}</p>
      {data.audioPrompt && <p className="mt-1 text-[10px] text-slate-400/70">🔊 {data.audioPrompt}</p>}
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-slate-400 !bg-slate-300" />
    </div>
  );
}
export const PromptNode = memo(PromptNodeComponent);
