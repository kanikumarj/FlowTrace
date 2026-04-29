import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeFlow } from "@/lib/simulator/issue-detector";

export async function POST(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const version = await prisma.flowVersion.findFirst({ where: { flowId: params.flowId, isActive: true } });
    if (!version) return NextResponse.json({ error: "Active version not found" }, { status: 404 });

    const result = analyzeFlow(version.normalizedJson as any);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
