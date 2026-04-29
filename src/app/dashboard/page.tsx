import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GitBranch, Upload, Users, FileText, ArrowUpRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {userName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of your workspace activity.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Flows", value: "0", icon: GitBranch, change: null },
          { label: "Active Versions", value: "0", icon: FileText, change: null },
          { label: "Team Members", value: "1", icon: Users, change: null },
          { label: "Simulations", value: "0", icon: ArrowUpRight, change: null },
        ].map((stat, i) => (
          <div
            key={i}
            className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Upload className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          No flows imported yet
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Import your first IVR call flow to get started with documentation,
          simulation, and auditing. Supported formats will be available in Phase 2.
        </p>
        <button
          disabled
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary opacity-60 cursor-not-allowed"
        >
          <Upload className="h-4 w-4" />
          Import Flow — Coming Soon
        </button>
      </div>

      {/* Recent activity placeholder */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No activity to show yet. Start by importing a flow.
        </div>
      </div>
    </div>
  );
}
