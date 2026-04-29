// POST /api/flows/[flowId]/export — Export flow in specified format
// GET /api/flows/[flowId]/export — alias for export history
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportFlow, type ExportFormatType } from "@/lib/export";
import { checkExportFormat } from "@/lib/billing/usage-gate";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { format, versionId, expiresInDays } = body;

    if (!["PDF", "HTML", "MARKDOWN", "MERMAID"].includes(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    // Determine workspace for usage gate
    const flow = await prisma.flow.findUniqueOrThrow({
      where: { id: params.flowId },
      select: { workspaceId: true },
    });

    // Check export format permission
    const gate = await checkExportFormat(flow.workspaceId, format);
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.reason, upgradeRequired: gate.upgradeRequired },
        { status: 403 }
      );
    }

    // Default to active version
    let targetVersionId = versionId;
    if (!targetVersionId) {
      const activeVersion = await prisma.flowVersion.findFirst({
        where: { flowId: params.flowId, isActive: true },
      });
      if (!activeVersion) {
        return NextResponse.json({ error: "No active version found" }, { status: 404 });
      }
      targetVersionId = activeVersion.id;
    }

    const result = await exportFlow(
      params.flowId,
      targetVersionId,
      format as ExportFormatType,
      session.user.id,
      { expiresInDays }
    );

    if (format === "PDF") {
      const buffer = result.content as Buffer;
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${result.fileName}"`,
        },
      });
    }

    return NextResponse.json({
      format: result.format,
      content: typeof result.content === "string" ? result.content : undefined,
      fileName: result.fileName,
      embedUrl: result.embedUrl,
      token: result.token,
    });
  } catch (error) {
    console.error("[EXPORT_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
