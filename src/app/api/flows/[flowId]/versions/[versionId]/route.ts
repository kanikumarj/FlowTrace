import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { flowId: string; versionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { label } = body;

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id, workspace: { flows: { some: { id: params.flowId } } } }
    });

    if (!membership || !["ADMIN", "ARCHITECT"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const version = await prisma.flowVersion.update({
      where: { id: params.versionId },
      data: { label }
    });

    return NextResponse.json({ version });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
