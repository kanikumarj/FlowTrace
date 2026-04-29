// POST /api/billing/portal — Create Stripe Customer Portal session
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPortalSession } from "@/lib/billing/subscription";

export async function POST() {
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

    const portalUrl = await createPortalSession(membership.workspaceId);
    return NextResponse.json({ portalUrl });
  } catch (error) {
    console.error("[PORTAL_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
