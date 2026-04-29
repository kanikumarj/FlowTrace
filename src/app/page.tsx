import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  Activity,
  GitBranch,
  Shield,
  Zap,
  ArrowRight,
  PlayCircle,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-primary/3 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.02] blur-[80px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(217 91% 53% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(217 91% 53% / 0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Flow<span className="text-primary">Trace</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/register">
              Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-20 pt-16 text-center lg:px-12 lg:pt-24">
        <div className="animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Zap className="h-3.5 w-3.5" />
            Phase 1 — Foundation Ready
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Document your{" "}
            <span className="gradient-text">IVR call flows</span>{" "}
            with confidence
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            FlowTrace is the SaaS platform built for contact center teams.
            Import, visualize, simulate, and audit your IVR architectures — all
            in one place.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="glow-blue px-8">
              <Link href="/auth/register">
                Start for Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">
                <PlayCircle className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: GitBranch,
              title: "Visual Flow Editor",
              description:
                "Import and visualize complex IVR decision trees with an interactive diagram editor.",
            },
            {
              icon: PlayCircle,
              title: "Call Simulation",
              description:
                "Walk through call paths step-by-step. QA teams can flag issues before they reach production.",
            },
            {
              icon: Shield,
              title: "Audit & Compliance",
              description:
                "Track every change with version history. Auditors get read-only access with full trail.",
            },
            {
              icon: FileCheck,
              title: "Version Control",
              description:
                "Compare flow versions side by side. Never lose track of what changed and when.",
            },
            {
              icon: Zap,
              title: "Role-Based Access",
              description:
                "Architects, QA, Analysts, and Auditors — each role sees exactly what they need.",
            },
            {
              icon: Activity,
              title: "Export & Share",
              description:
                "Export flows as PDF, JSON, or images. Share documentation across teams seamlessly.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-card group rounded-xl p-6 text-left transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} FlowTrace. Built for contact center
        excellence.
      </footer>
    </div>
  );
}
