import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Debounced node position update — saves x/y after drag */
export async function PATCH(
  request: Request,
  { params }: { params: { flowId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body as {
      updates: Array<{ nodeId: string; positionX: number; positionY: number }>;
    };

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Missing updates array" }, { status: 400 });
    }

    await prisma.$transaction(
      updates.map((u) =>
        prisma.flowNode.updateMany({
          where: { flowId: params.flowId, nodeId: u.nodeId },
          data: { positionX: u.positionX, positionY: u.positionY },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[NODES_POSITION_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
