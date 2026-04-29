import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Users } from "lucide-react";

function QueueNodeComponent({ data, selected }: NodeProps) {
  return (
    <div className={`min-w-[170px] rounded-lg border bg-teal-950/80 px-3 py-2.5 shadow-md backdrop-blur transition-all ${selected ? "border-teal-400 shadow-teal-500/20" : "border-teal-800/60"}`}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-teal-500 !bg-teal-400" />
      <div className="mb-1.5 flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-teal-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">Queue</span>
      </div>
      <p className="text-xs font-medium text-teal-50 leading-snug">{data.label}</p>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-teal-500 !bg-teal-400" />
    </div>
  );
}
export const QueueNode = memo(QueueNodeComponent);
