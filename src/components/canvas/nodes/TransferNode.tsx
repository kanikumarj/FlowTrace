import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { PhoneForwarded } from "lucide-react";

function TransferNodeComponent({ data, selected }: NodeProps) {
  return (
    <div className={`min-w-[170px] rounded-lg border bg-purple-950/80 px-3 py-2.5 shadow-md backdrop-blur transition-all ${selected ? "border-purple-400 shadow-purple-500/20" : "border-purple-800/60"}`}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-purple-500 !bg-purple-400" />
      <div className="mb-1.5 flex items-center gap-1.5">
        <PhoneForwarded className="h-3.5 w-3.5 text-purple-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">Transfer</span>
      </div>
      <p className="text-xs font-medium text-purple-50 leading-snug">{data.label}</p>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-purple-500 !bg-purple-400" />
    </div>
  );
}
export const TransferNode = memo(TransferNodeComponent);
