// GET /api/flows/[flowId]/export/history — Last 10 exports
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exports = await prisma.exportRecord.findMany({
      where: { flowId: params.flowId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        exportedByUser: { select: { name: true, email: true } },
        version: { select: { versionNumber: true } },
      },
    });

    return NextResponse.json({ exports });
  } catch (error) {
    console.error("[EXPORT_HISTORY_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
