import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { flowId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flow = await prisma.flow.findUnique({
      where: { id: params.flowId },
      include: {
        nodes: true,
        edges: true,
        createdBy: { select: { name: true, email: true } },
      },
    });

    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    return NextResponse.json({ flow });
  } catch (error) {
    console.error("[FLOW_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const { name } = body;

    const flow = await prisma.flow.update({
      where: { id: params.flowId },
      data: { ...(name && { name }) },
    });

    return NextResponse.json({ flow });
  } catch (error) {
    console.error("[FLOW_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { flowId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.flow.delete({ where: { id: params.flowId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FLOW_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
