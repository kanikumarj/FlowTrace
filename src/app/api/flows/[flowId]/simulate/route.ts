import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { traceCall } from "@/lib/simulator/path-tracer";

export async function POST(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { dnis, timeOfDay, callerType, versionId } = body;

    let version;
    if (versionId) {
      version = await prisma.flowVersion.findUnique({ where: { id: versionId } });
    } else {
      version = await prisma.flowVersion.findFirst({ where: { flowId: params.flowId, isActive: true } });
    }

    if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

    const flowJson = version.normalizedJson as unknown as import("@/lib/parsers/types").NormalizedFlow;
    const result = traceCall(flowJson, { dnis, timeOfDay, callerType });

    const simulation = await prisma.simulationRun.create({
      data: {
        flowId: params.flowId,
        versionId: version.id,
        runById: session.user.id,
        inputDnis: dnis,
        inputTime: timeOfDay,
        inputCallerType: callerType,
        resultPath: result.path,
        resultOutcome: result.outcome,
        totalSteps: result.totalSteps,
        flaggedIssues: JSON.parse(JSON.stringify(result.issues)),
      }
    });

    return NextResponse.json({ result: simulation, outcomeLabel: result.outcomeLabel });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
