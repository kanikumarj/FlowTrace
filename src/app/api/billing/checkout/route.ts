// POST /api/billing/checkout — Create Stripe Checkout Session
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/billing/subscription";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, interval = "month" } = body;

    if (!["PRO", "ENTERPRISE"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id, role: "ADMIN" },
      select: { workspaceId: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const checkoutUrl = await createCheckoutSession(
      membership.workspaceId,
      plan,
      interval
    );

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
