import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeDiff } from "@/lib/versioning/diff-engine";

export async function GET(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const fromId = searchParams.get("from");
    const toId = searchParams.get("to");

    if (!fromId || !toId) {
      return NextResponse.json({ error: "Missing from or to version IDs" }, { status: 400 });
    }

    const fromVersion = await prisma.flowVersion.findUnique({ where: { id: fromId } });
    const toVersion = await prisma.flowVersion.findUnique({ where: { id: toId } });

    if (!fromVersion || !toVersion) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const diff = await computeDiff(fromVersion, toVersion);

    return NextResponse.json({ diff: diff.diffJson });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
