// GET /api/integrations/confluence/callback — Handle OAuth callback
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens, encryptToken } from "@/lib/confluence/oauth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // workspaceId

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/settings/integrations?error=missing_params", request.url)
      );
    }

    const tokens = await exchangeCodeForTokens(code);

    // Get accessible resources to find the Confluence site URL
    const resourcesRes = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: { Authorization: `Bearer ${tokens.accessToken}`, Accept: "application/json" },
    });
    const resources = await resourcesRes.json();
    const site = resources[0];
    const siteUrl = site ? `https://api.atlassian.com/ex/confluence/${site.id}` : "";

    await prisma.workspace.update({
      where: { id: state },
      data: {
        confluenceAccessToken: encryptToken(tokens.accessToken),
        confluenceRefreshToken: encryptToken(tokens.refreshToken),
        confluenceSiteUrl: siteUrl,
      },
    });

    return NextResponse.redirect(
      new URL("/dashboard/settings/integrations?success=true", request.url)
    );
  } catch (error) {
    console.error("[CONFLUENCE_CALLBACK_ERROR]", error);
    return NextResponse.redirect(
      new URL("/dashboard/settings/integrations?error=auth_failed", request.url)
    );
  }
}
