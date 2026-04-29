// GET /api/integrations/confluence/spaces — List available spaces
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/confluence/oauth";
import { getSpaces } from "@/lib/confluence/client";

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
      return NextResponse.json({ error: "No workspace" }, { status: 404 });
    }

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: membership.workspaceId },
    });

    if (!workspace.confluenceAccessToken || !workspace.confluenceSiteUrl) {
      return NextResponse.json({ error: "Confluence not connected" }, { status: 400 });
    }

    const accessToken = decryptToken(workspace.confluenceAccessToken);
    const spaces = await getSpaces(accessToken, workspace.confluenceSiteUrl, membership.workspaceId);

    return NextResponse.json({ spaces });
  } catch (error) {
    console.error("[CONFLUENCE_SPACES_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
