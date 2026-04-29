// ─── Usage Gate — Server-side plan enforcement ──────────────
// Called before every gated action to hard-block over-limit usage.

import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanTier } from "./plans";

export type GateMetric =
  | "FLOW_COUNT"
  | "USER_COUNT"
  | "SIMULATION_RUN"
  | "EXPORT"
  | "VERSION_COUNT";

export type GateCapability =
  | "confluenceSync"
  | "htmlEmbed"
  | "apiAccess"
  | "auditLog"
  | "ssoEnabled";

export interface GateResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: PlanTier;
  currentValue?: number;
  limit?: number;
}

export async function checkLimit(
  workspaceId: string,
  metric: GateMetric,
  requiredCapability?: GateCapability
): Promise<GateResult> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true, subscriptionStatus: true, planExpiresAt: true },
  });

  if (!workspace) {
    return { allowed: false, reason: "Workspace not found" };
  }

  const plan = workspace.plan as PlanTier;
  const limits = PLAN_LIMITS[plan];

  // Check subscription validity for paid plans
  if (plan !== "FREE") {
    const isActive =
      workspace.subscriptionStatus === "ACTIVE" ||
      workspace.subscriptionStatus === "TRIALING";
    if (!isActive) {
      return {
        allowed: false,
        reason: "Your subscription is no longer active. Please update your billing.",
        upgradeRequired: "PRO",
      };
    }
  }

  // Capability check (boolean features like confluenceSync)
  if (requiredCapability) {
    const hasCapability = limits[requiredCapability];
    if (!hasCapability) {
      const minPlan = requiredCapability === "apiAccess" || requiredCapability === "auditLog" || requiredCapability === "ssoEnabled"
        ? "ENTERPRISE"
        : "PRO";
      return {
        allowed: false,
        reason: `${formatCapability(requiredCapability)} requires the ${minPlan} plan.`,
        upgradeRequired: minPlan,
      };
    }
    return { allowed: true };
  }

  // Numeric limit check
  const usageRecord = await prisma.usageRecord.findUnique({
    where: { workspaceId_metric: { workspaceId, metric } },
  });

  const currentValue = usageRecord?.value ?? 0;
  const limitValue = getNumericLimit(limits, metric);

  if (limitValue === -1) {
    return { allowed: true, currentValue, limit: -1 };
  }

  if (currentValue >= limitValue) {
    const nextPlan: PlanTier = plan === "FREE" ? "PRO" : "ENTERPRISE";
    return {
      allowed: false,
      reason: `You've reached your ${plan} plan limit of ${limitValue} for ${formatMetric(metric)}.`,
      upgradeRequired: nextPlan,
      currentValue,
      limit: limitValue,
    };
  }

  return { allowed: true, currentValue, limit: limitValue };
}

export async function checkExportFormat(
  workspaceId: string,
  format: string
): Promise<GateResult> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true },
  });

  if (!workspace) return { allowed: false, reason: "Workspace not found" };

  const plan = workspace.plan as PlanTier;
  const limits = PLAN_LIMITS[plan];

  if (!limits.exportFormats.includes(format)) {
    return {
      allowed: false,
      reason: `${format} export requires the PRO plan.`,
      upgradeRequired: "PRO",
    };
  }

  return { allowed: true };
}

export async function incrementUsage(
  workspaceId: string,
  metric: GateMetric,
  delta: number = 1
): Promise<void> {
  await prisma.usageRecord.upsert({
    where: { workspaceId_metric: { workspaceId, metric } },
    update: { value: { increment: delta } },
    create: { workspaceId, metric, value: delta },
  });
}

export async function decrementUsage(
  workspaceId: string,
  metric: GateMetric,
  delta: number = 1
): Promise<void> {
  const record = await prisma.usageRecord.findUnique({
    where: { workspaceId_metric: { workspaceId, metric } },
  });
  if (record && record.value > 0) {
    await prisma.usageRecord.update({
      where: { id: record.id },
      data: { value: Math.max(0, record.value - delta) },
    });
  }
}

export async function resetMonthlyUsage(workspaceId: string): Promise<void> {
  await prisma.usageRecord.updateMany({
    where: { workspaceId, metric: "SIMULATION_RUN" },
    data: { value: 0 },
  });
}

function getNumericLimit(limits: typeof PLAN_LIMITS["FREE"], metric: GateMetric): number {
  switch (metric) {
    case "FLOW_COUNT": return limits.maxFlows;
    case "USER_COUNT": return limits.maxUsers;
    case "SIMULATION_RUN": return limits.simulationRuns;
    case "VERSION_COUNT": return limits.maxVersionsPerFlow;
    case "EXPORT": return -1; // exports not numerically limited
    default: return 0;
  }
}

function formatMetric(metric: GateMetric): string {
  const labels: Record<GateMetric, string> = {
    FLOW_COUNT: "flows",
    USER_COUNT: "team members",
    SIMULATION_RUN: "simulation runs this month",
    EXPORT: "exports",
    VERSION_COUNT: "versions per flow",
  };
  return labels[metric];
}

function formatCapability(cap: GateCapability): string {
  const labels: Record<GateCapability, string> = {
    confluenceSync: "Confluence sync",
    htmlEmbed: "HTML embed",
    apiAccess: "API access",
    auditLog: "Audit logging",
    ssoEnabled: "SSO/SAML",
  };
  return labels[cap];
}
