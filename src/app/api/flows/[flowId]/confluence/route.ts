// POST /api/flows/[flowId]/confluence — Setup or sync Confluence
// DELETE /api/flows/[flowId]/confluence — Disconnect sync
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkLimit } from "@/lib/billing/usage-gate";
import { syncFlowToConfluence } from "@/lib/confluence/sync-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flow = await prisma.flow.findUniqueOrThrow({
      where: { id: params.flowId },
      select: { workspaceId: true },
    });

    // Check confluence capability
    const gate = await checkLimit(flow.workspaceId, "FLOW_COUNT", "confluenceSync");
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.reason, upgradeRequired: gate.upgradeRequired },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { spaceKey, pageId, autoSync, siteUrl, action } = body;

    if (action === "sync") {
      // Manual sync trigger
      const result = await syncFlowToConfluence(params.flowId, flow.workspaceId);
      return NextResponse.json(result);
    }

    // Setup or update sync config
    const syncRecord = await prisma.confluenceSync.upsert({
      where: {
        flowId_workspaceId: {
          flowId: params.flowId,
          workspaceId: flow.workspaceId,
        },
      },
      update: {
        confluenceSpaceKey: spaceKey,
        confluencePageId: pageId || null,
        confluenceSiteUrl: siteUrl,
        autoSync: autoSync ?? false,
      },
      create: {
        flowId: params.flowId,
        workspaceId: flow.workspaceId,
        confluenceSpaceKey: spaceKey,
        confluencePageId: pageId || null,
        confluenceSiteUrl: siteUrl,
        autoSync: autoSync ?? false,
        createdById: session.user.id,
      },
    });

    // Run initial sync
    const result = await syncFlowToConfluence(params.flowId, flow.workspaceId);

    return NextResponse.json({
      syncId: syncRecord.id,
      pageUrl: result.pageUrl,
      status: result.success ? "SUCCESS" : "FAILED",
    });
  } catch (error) {
    console.error("[CONFLUENCE_SETUP_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flow = await prisma.flow.findUniqueOrThrow({
      where: { id: params.flowId },
      select: { workspaceId: true },
    });

    await prisma.confluenceSync.deleteMany({
      where: { flowId: params.flowId, workspaceId: flow.workspaceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONFLUENCE_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
