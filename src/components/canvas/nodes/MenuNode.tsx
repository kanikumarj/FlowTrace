import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Menu } from "lucide-react";

function MenuNodeComponent({ data, selected }: NodeProps) {
  return (
    <div className={`min-w-[180px] rounded-lg border bg-blue-950/80 px-3 py-2.5 shadow-md backdrop-blur transition-all ${selected ? "border-blue-400 shadow-blue-500/20" : "border-blue-800/60"}`}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-blue-500 !bg-blue-400" />
      <div className="mb-1.5 flex items-center gap-1.5">
        <Menu className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Menu</span>
      </div>
      <p className="text-xs font-medium text-blue-50 leading-snug">{data.label}</p>
      {data.audioPrompt && <p className="mt-1 text-[10px] text-blue-300/60">🔊 {data.audioPrompt}</p>}
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-blue-500 !bg-blue-400" />
    </div>
  );
}
export const MenuNode = memo(MenuNodeComponent);
