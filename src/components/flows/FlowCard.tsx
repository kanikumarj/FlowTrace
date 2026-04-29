import Link from "next/link";
import { GitBranch, Clock, Hash } from "lucide-react";

const platformBadge: Record<string, { label: string; class: string }> = {
  AMAZON_CONNECT: { label: "Amazon Connect", class: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  CISCO_UCCX: { label: "Cisco UCCX", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  GENESYS: { label: "Genesys", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

const statusBadge: Record<string, { label: string; class: string }> = {
  READY: { label: "Ready", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  PROCESSING: { label: "Processing", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  ERROR: { label: "Error", class: "bg-red-500/10 text-red-400 border-red-500/20" },
};

interface FlowCardProps {
  id: string;
  name: string;
  platform: string;
  nodeCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { name: string | null; email: string };
}

export function FlowCard({ id, name, platform, nodeCount, status, updatedAt, createdBy }: FlowCardProps) {
  const pb = platformBadge[platform] || platformBadge.AMAZON_CONNECT;
  const sb = statusBadge[status] || statusBadge.PROCESSING;
  const timeAgo = getRelativeTime(updatedAt);

  return (
    <Link href={`/dashboard/flows/${id}`} className="group block">
      <div className="rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <GitBranch className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{name}</h3>
              {createdBy && <p className="text-[11px] text-muted-foreground">{createdBy.name || createdBy.email}</p>}
            </div>
          </div>
          <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${sb.class}`}>{sb.label}</span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${pb.class}`}>{pb.label}</span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Hash className="h-3 w-3" />{nodeCount} nodes
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />{timeAgo}
          </span>
        </div>
      </div>
    </Link>
  );
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
