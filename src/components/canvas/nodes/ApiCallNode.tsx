import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Globe } from "lucide-react";

function ApiCallNodeComponent({ data, selected }: NodeProps) {
  return (
    <div className={`min-w-[170px] rounded-lg border bg-orange-950/80 px-3 py-2.5 shadow-md backdrop-blur transition-all ${selected ? "border-orange-400 shadow-orange-500/20" : "border-orange-800/60"}`}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-orange-500 !bg-orange-400" />
      <div className="mb-1.5 flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5 text-orange-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-400">API Call</span>
      </div>
      <p className="text-xs font-medium text-orange-50 leading-snug">{data.label}</p>
      <Handle type="source" position={Position.Bottom} id="success" className="!h-2 !w-2 !border-emerald-500 !bg-emerald-400" style={{ left: "30%" }} />
      <Handle type="source" position={Position.Bottom} id="failure" className="!h-2 !w-2 !border-red-500 !bg-red-400" style={{ left: "70%" }} />
    </div>
  );
}
export const ApiCallNode = memo(ApiCallNodeComponent);
