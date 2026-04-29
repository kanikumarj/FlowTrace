// ─── Confluence REST API v2 Client ──────────────────────────
// Wraps Confluence Cloud API with auto-retry on 401/429.

import { refreshAccessToken, decryptToken, encryptToken } from "./oauth";
import { prisma } from "@/lib/prisma";

interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
}

interface ConfluencePage {
  id: string;
  title: string;
  version: { number: number };
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  workspaceId: string,
  retries: number = 3
): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 401 && retries > 0) {
    // Refresh token and retry
    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });
    if (!workspace.confluenceRefreshToken) throw new Error("No refresh token");

    const decryptedRefresh = decryptToken(workspace.confluenceRefreshToken);
    const tokens = await refreshAccessToken(decryptedRefresh);

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        confluenceAccessToken: encryptToken(tokens.accessToken),
        confluenceRefreshToken: encryptToken(tokens.refreshToken),
      },
    });

    const newHeaders = new Headers(options.headers);
    newHeaders.set("Authorization", `Bearer ${tokens.accessToken}`);
    return fetchWithRetry(url, { ...options, headers: newHeaders }, workspaceId, retries - 1);
  }

  if (response.status === 429 && retries > 0) {
    const retryAfter = parseInt(response.headers.get("Retry-After") ?? "2", 10);
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return fetchWithRetry(url, options, workspaceId, retries - 1);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Confluence API error ${response.status}: ${body}`);
  }

  return response;
}

function buildHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function getSpaces(
  accessToken: string,
  siteUrl: string,
  workspaceId: string
): Promise<ConfluenceSpace[]> {
  const res = await fetchWithRetry(
    `${siteUrl}/wiki/api/v2/spaces?limit=50`,
    { headers: buildHeaders(accessToken) },
    workspaceId
  );
  const data = await res.json();
  return data.results.map((s: Record<string, string>) => ({
    id: s.id,
    key: s.key,
    name: s.name,
  }));
}

export async function getPages(
  accessToken: string,
  siteUrl: string,
  spaceKey: string,
  workspaceId: string
): Promise<ConfluencePage[]> {
  const res = await fetchWithRetry(
    `${siteUrl}/wiki/api/v2/spaces/${spaceKey}/pages?limit=50`,
    { headers: buildHeaders(accessToken) },
    workspaceId
  );
  const data = await res.json();
  return data.results;
}

export async function createPage(
  accessToken: string,
  siteUrl: string,
  spaceId: string,
  title: string,
  body: string,
  workspaceId: string
): Promise<ConfluencePage> {
  const res = await fetchWithRetry(
    `${siteUrl}/wiki/api/v2/pages`,
    {
      method: "POST",
      headers: buildHeaders(accessToken),
      body: JSON.stringify({
        spaceId,
        status: "current",
        title,
        body: { representation: "storage", value: body },
      }),
    },
    workspaceId
  );
  return res.json();
}

export async function updatePage(
  accessToken: string,
  siteUrl: string,
  pageId: string,
  version: number,
  title: string,
  body: string,
  workspaceId: string
): Promise<ConfluencePage> {
  const res = await fetchWithRetry(
    `${siteUrl}/wiki/api/v2/pages/${pageId}`,
    {
      method: "PUT",
      headers: buildHeaders(accessToken),
      body: JSON.stringify({
        id: pageId,
        status: "current",
        title,
        body: { representation: "storage", value: body },
        version: { number: version + 1, message: "Synced by FlowTrace" },
      }),
    },
    workspaceId
  );
  return res.json();
}

export async function getPageVersion(
  accessToken: string,
  siteUrl: string,
  pageId: string,
  workspaceId: string
): Promise<number> {
  const res = await fetchWithRetry(
    `${siteUrl}/wiki/api/v2/pages/${pageId}`,
    { headers: buildHeaders(accessToken) },
    workspaceId
  );
  const data = await res.json();
  return data.version?.number ?? 1;
}
