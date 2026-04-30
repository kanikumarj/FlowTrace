import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseFlow } from "@/lib/parsers";
import type { Platform } from "@/lib/parsers/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_EXTENSIONS = ["json", "xml", "aef", "i3inboundflow"];
const VALID_PLATFORMS: Platform[] = ["AMAZON_CONNECT", "CISCO_UCCX", "GENESYS"];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    // Get user's workspace
    let membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    });

    if (!membership) {
      // Auto-provision a workspace if the user doesn't have one
      const workspace = await prisma.workspace.create({
        data: {
          name: `${session.user.name || "My"}'s Workspace`,
          ownerId: session.user.id,
          members: {
            create: {
              userId: session.user.id,
              role: "ADMIN",
            },
          },
        },
      });
      membership = { workspaceId: workspace.id };
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const platform = formData.get("platform") as string | null;
    const flowName = formData.get("flowName") as string | null;

    // ─── Validation ────────────────────────────────────────────
    if (!file) {
      return NextResponse.json({ success: false, error: { code: "NO_FILE", message: "File is required" } }, { status: 400 });
    }
    if (!platform || !VALID_PLATFORMS.includes(platform as Platform)) {
      return NextResponse.json({ success: false, error: { code: "INVALID_PLATFORM", message: `Platform must be one of: ${VALID_PLATFORMS.join(", ")}` } }, { status: 400 });
    }
    if (!flowName || flowName.trim().length === 0) {
      return NextResponse.json({ success: false, error: { code: "NO_NAME", message: "Flow name is required" } }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: { code: "FILE_TOO_LARGE", message: "File exceeds 10MB limit" } }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!VALID_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ success: false, error: { code: "INVALID_TYPE", message: "Only .json, .xml, .aef, and .i3InboundFlow files are supported" } }, { status: 400 });
    }

    // ─── Create Flow record (PROCESSING) ───────────────────────
    const flow = await prisma.flow.create({
      data: {
        name: flowName.trim(),
        workspaceId: membership.workspaceId,
        platform: platform as Platform,
        status: "PROCESSING",
        createdById: session.user.id,
      },
    });

    // ─── Parse file ────────────────────────────────────────────
    const fileContent = await file.text();
    const result = await parseFlow(fileContent, platform as Platform, flowName.trim(), flow.id);

    if (!result.success || !result.data) {
      await prisma.flow.update({
        where: { id: flow.id },
        data: { status: "ERROR" },
      });
      return NextResponse.json({
        success: false,
        flowId: flow.id,
        error: { code: "PARSE_FAILED", message: result.error || "Failed to parse flow file", detail: result.error },
      }, { status: 422 });
    }

    // ─── Save nodes + edges to DB ──────────────────────────────
    const normalizedData = result.data;

    await prisma.$transaction(async (tx) => {
      // Create FlowNodes
      await tx.flowNode.createMany({
        data: normalizedData.nodes.map((node, idx) => {
          const pos = (node.metadata as Record<string, unknown>)?.position as { x: number; y: number } | undefined;
          return {
            flowId: flow.id,
            nodeId: node.id,
            type: node.type as "MENU" | "PROMPT" | "TRANSFER" | "CONDITION" | "API_CALL" | "QUEUE" | "HANGUP" | "START" | "VOICEMAIL" | "UNKNOWN",
            label: node.label,
            metadata: node.metadata as object,
            positionX: pos?.x ?? idx * 50,
            positionY: pos?.y ?? idx * 100,
          };
        }),
      });

      // Create FlowEdges
      if (normalizedData.edges.length > 0) {
        await tx.flowEdge.createMany({
          data: normalizedData.edges.map((edge) => ({
            flowId: flow.id,
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            label: edge.label,
            condition: edge.condition,
          })),
        });
      }

      // Update flow with normalized data
      await tx.flow.update({
        where: { id: flow.id },
        data: {
          normalizedJson: normalizedData as object,
          nodeCount: normalizedData.nodes.length,
          status: "READY",
        },
      });
    });

    return NextResponse.json({
      success: true,
      flowId: flow.id,
      nodeCount: normalizedData.nodes.length,
      edgeCount: normalizedData.edges.length,
      status: "READY",
    }, { status: 201 });

  } catch (error) {
    console.error("[FLOW_UPLOAD_ERROR]", error);
    return NextResponse.json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong during upload", detail: String(error) },
    }, { status: 500 });
  }
}
