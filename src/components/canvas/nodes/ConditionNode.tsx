import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { GitBranch } from "lucide-react";

function ConditionNodeComponent({ data, selected }: NodeProps) {
  return (
    <div className={`min-w-[160px] rounded-lg border bg-amber-950/80 px-3 py-2.5 shadow-md backdrop-blur transition-all ${selected ? "border-amber-400 shadow-amber-500/20" : "border-amber-800/60"}`} style={{ transform: "rotate(0deg)" }}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-amber-500 !bg-amber-400" />
      <div className="mb-1.5 flex items-center gap-1.5">
        <GitBranch className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Condition</span>
      </div>
      <p className="text-xs font-medium text-amber-50 leading-snug">{data.label}</p>
      <Handle type="source" position={Position.Bottom} id="true" className="!-left-0 !bottom-0 !h-2 !w-2 !border-emerald-500 !bg-emerald-400" style={{ left: "30%" }} />
      <Handle type="source" position={Position.Bottom} id="false" className="!h-2 !w-2 !border-red-500 !bg-red-400" style={{ left: "70%" }} />
    </div>
  );
}
export const ConditionNode = memo(ConditionNodeComponent);
