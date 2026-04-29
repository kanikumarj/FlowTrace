// GET /api/billing/status — Current plan, subscription status, and usage
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanTier } from "@/lib/billing/plans";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: membership.workspaceId },
      select: {
        plan: true,
        subscriptionStatus: true,
        planExpiresAt: true,
        stripeCustomerId: true,
      },
    });

    const usageRecords = await prisma.usageRecord.findMany({
      where: { workspaceId: membership.workspaceId },
    });

    const usage: Record<string, { current: number; limit: number }> = {};
    const plan = workspace.plan as PlanTier;
    const limits = PLAN_LIMITS[plan];

    const metricMap: Record<string, keyof typeof limits> = {
      FLOW_COUNT: "maxFlows",
      USER_COUNT: "maxUsers",
      VERSION_COUNT: "maxVersionsPerFlow",
      SIMULATION_RUN: "simulationRuns",
    };

    for (const [metric, limitKey] of Object.entries(metricMap)) {
      const record = usageRecords.find((r) => r.metric === metric);
      usage[metric] = {
        current: record?.value ?? 0,
        limit: limits[limitKey] as number,
      };
    }

    return NextResponse.json({
      plan: workspace.plan,
      status: workspace.subscriptionStatus,
      planExpiresAt: workspace.planExpiresAt,
      limits,
      usage,
    });
  } catch (error) {
    console.error("[BILLING_STATUS_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
