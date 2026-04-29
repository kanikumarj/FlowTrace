import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

function HangupNodeComponent({ data }: NodeProps) {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500 bg-red-500/20 shadow-lg shadow-red-500/10">
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-red-500 !bg-red-400" />
      <span className="text-[9px] font-bold text-red-400 text-center leading-tight">{data.label || "End Call"}</span>
    </div>
  );
}
export const HangupNode = memo(HangupNodeComponent);
