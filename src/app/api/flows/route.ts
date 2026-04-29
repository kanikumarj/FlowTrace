import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({ flows: [] });
    }

    const flows = await prisma.flow.findMany({
      where: { workspaceId: membership.workspaceId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        platform: true,
        nodeCount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ flows });
  } catch (error) {
    console.error("[FLOWS_LIST_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
