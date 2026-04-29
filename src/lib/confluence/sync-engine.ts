// ─── Confluence Sync Engine ──────────────────────────────────
// Pushes flow documentation to Confluence pages.

import { prisma } from "@/lib/prisma";
import { decryptToken } from "./oauth";
import { createPage, updatePage, getPageVersion } from "./client";
import { generateMermaid } from "@/lib/export/mermaid-exporter";
import type { NormalizedFlow } from "@/lib/parsers/types";

interface SyncResult {
  success: boolean;
  pageUrl?: string;
  syncedAt?: Date;
  error?: string;
}

export async function syncFlowToConfluence(
  flowId: string,
  workspaceId: string
): Promise<SyncResult> {
  try {
    const sync = await prisma.confluenceSync.findUnique({
      where: { flowId_workspaceId: { flowId, workspaceId } },
    });

    if (!sync) {
      return { success: false, error: "No Confluence sync config found" };
    }

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });

    if (!workspace.confluenceAccessToken) {
      return { success: false, error: "Confluence not connected" };
    }

    const accessToken = decryptToken(workspace.confluenceAccessToken);

    const version = await prisma.flowVersion.findFirst({
      where: { flowId, isActive: true },
      include: { flow: true },
    });

    if (!version) {
      return { success: false, error: "No active flow version" };
    }

    const flow = version.normalizedJson as unknown as NormalizedFlow;
    const body = buildConfluenceBody(flow, version.flow.name, version.flow.platform, version.versionNumber);
    const title = `${version.flow.name} — IVR Flow Documentation`;

    let pageUrl: string;

    if (sync.confluencePageId) {
      const currentVersion = await getPageVersion(
        accessToken,
        sync.confluenceSiteUrl,
        sync.confluencePageId,
        workspaceId
      );
      await updatePage(
        accessToken,
        sync.confluenceSiteUrl,
        sync.confluencePageId,
        currentVersion,
        title,
        body,
        workspaceId
      );
      pageUrl = `${sync.confluenceSiteUrl}/wiki/spaces/${sync.confluenceSpaceKey}/pages/${sync.confluencePageId}`;
    } else {
      const page = await createPage(
        accessToken,
        sync.confluenceSiteUrl,
        sync.confluenceSpaceKey,
        title,
        body,
        workspaceId
      );
      await prisma.confluenceSync.update({
        where: { id: sync.id },
        data: { confluencePageId: page.id },
      });
      pageUrl = `${sync.confluenceSiteUrl}/wiki/spaces/${sync.confluenceSpaceKey}/pages/${page.id}`;
    }

    const syncedAt = new Date();
    await prisma.confluenceSync.update({
      where: { id: sync.id },
      data: { lastSyncedAt: syncedAt, lastSyncStatus: "SUCCESS", lastSyncError: null },
    });

    return { success: true, pageUrl, syncedAt };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    await prisma.confluenceSync.updateMany({
      where: { flowId, workspaceId },
      data: { lastSyncStatus: "FAILED", lastSyncError: errorMsg },
    });
    return { success: false, error: errorMsg };
  }
}

function buildConfluenceBody(
  flow: NormalizedFlow,
  flowName: string,
  platform: string,
  versionNumber: number
): string {
  const mermaid = generateMermaid(flow);
  const nodeRows = flow.nodes
    .map(
      (n) =>
        `<tr><td>${n.id}</td><td>${n.type}</td><td>${n.label}</td><td>${n.audioPrompt ?? "—"}</td></tr>`
    )
    .join("");

  const timestamp = new Date().toISOString();

  return `
<h1>${flowName} — IVR Flow Documentation</h1>
<ac:structured-macro ac:name="info"><ac:rich-text-body>
<p><strong>Platform:</strong> ${platform.replace("_", " ")} | <strong>Version:</strong> ${versionNumber} | <strong>Nodes:</strong> ${flow.nodes.length} | <strong>Edges:</strong> ${flow.edges.length}</p>
</ac:rich-text-body></ac:structured-macro>

<h2>Flow Diagram</h2>
<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">mermaid</ac:parameter><ac:plain-text-body><![CDATA[${mermaid}]]></ac:plain-text-body></ac:structured-macro>

<h2>Node Reference</h2>
<table><thead><tr><th>Node ID</th><th>Type</th><th>Label</th><th>Audio Prompt</th></tr></thead><tbody>${nodeRows}</tbody></table>

<hr/>
<p><em>Auto-synced by <a href="https://flowtrace.io">FlowTrace</a> — ${timestamp}</em></p>`;
}
