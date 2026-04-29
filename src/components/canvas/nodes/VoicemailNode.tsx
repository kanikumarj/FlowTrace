import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Voicemail, HelpCircle } from "lucide-react";

function VoicemailNodeComponent({ data, selected }: NodeProps) {
  return (
    <div className={`min-w-[170px] rounded-lg border bg-indigo-950/80 px-3 py-2.5 shadow-md backdrop-blur transition-all ${selected ? "border-indigo-400 shadow-indigo-500/20" : "border-indigo-800/60"}`}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-indigo-500 !bg-indigo-400" />
      <div className="mb-1.5 flex items-center gap-1.5">
        <Voicemail className="h-3.5 w-3.5 text-indigo-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Voicemail</span>
      </div>
      <p className="text-xs font-medium text-indigo-50 leading-snug">{data.label}</p>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-indigo-500 !bg-indigo-400" />
    </div>
  );
}
export const VoicemailNode = memo(VoicemailNodeComponent);

function UnknownNodeComponent({ data, selected }: NodeProps) {
  return (
    <div className={`min-w-[160px] rounded-lg border border-dashed bg-zinc-900/80 px-3 py-2.5 shadow-md transition-all ${selected ? "border-zinc-400" : "border-zinc-700"}`}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-zinc-500 !bg-zinc-400" />
      <div className="mb-1.5 flex items-center gap-1.5">
        <HelpCircle className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Unknown</span>
      </div>
      <p className="text-xs font-medium text-zinc-200 leading-snug">{data.label}</p>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-zinc-500 !bg-zinc-400" />
    </div>
  );
}
export const UnknownNode = memo(UnknownNodeComponent);
