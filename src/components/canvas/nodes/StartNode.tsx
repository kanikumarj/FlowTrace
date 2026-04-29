import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

function StartNodeComponent({ data }: NodeProps) {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/10">
      <span className="text-xs font-bold text-emerald-400">{data.label || "Start"}</span>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-emerald-500 !bg-emerald-400" />
    </div>
  );
}
export const StartNode = memo(StartNodeComponent);
