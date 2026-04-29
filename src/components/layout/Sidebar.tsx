"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  GitBranch,
  History,
  PlayCircle,
  Download,
  Settings,
  X,
  Activity,
  CreditCard,
  Plug,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Flows", href: "/dashboard/flows", icon: GitBranch },
  { label: "Versions", href: "/dashboard/versions", icon: History },
  { label: "Simulate", href: "/dashboard/simulate", icon: PlayCircle },
  { label: "Export", href: "/dashboard/export", icon: Download },
];

const bottomNavItems = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
  { label: "Integrations", href: "/dashboard/settings/integrations", icon: Plug },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out lg:relative lg:z-auto lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Activity className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Flow<span className="text-primary">Trace</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Main nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Navigation
          </p>
          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                    : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.label}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* Bottom nav */}
        <div className="space-y-1 px-3 py-3">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Version badge */}
        <div className="border-t border-sidebar-border px-5 py-3">
          <p className="text-[11px] text-muted-foreground/50">
            FlowTrace v0.4.0 · Phase 4
          </p>
        </div>
      </aside>
    </>
  );
}
