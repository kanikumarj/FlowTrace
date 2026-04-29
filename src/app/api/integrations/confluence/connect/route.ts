// GET /api/integrations/confluence/connect — Redirect to Atlassian OAuth
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getConfluenceAuthUrl } from "@/lib/confluence/oauth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id, role: "ADMIN" },
      select: { workspaceId: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const authUrl = getConfluenceAuthUrl(membership.workspaceId);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[CONFLUENCE_CONNECT_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
