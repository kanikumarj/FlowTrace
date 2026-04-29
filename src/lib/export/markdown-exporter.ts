// ─── Markdown Exporter ───────────────────────────────────────
// Generates a full Markdown document with embedded Mermaid diagram,
// node reference table, and change log.

import { prisma } from "@/lib/prisma";
import { generateMermaid } from "./mermaid-exporter";
import type { NormalizedFlow } from "@/lib/parsers/types";

export async function generateMarkdown(
  flowId: string,
  versionId: string
): Promise<string> {
  const version = await prisma.flowVersion.findUniqueOrThrow({
    where: { id: versionId },
    include: { flow: true },
  });

  const flow = version.normalizedJson as unknown as NormalizedFlow;
  const mermaidDiagram = generateMermaid(flow);

  // Fetch recent diffs
  const diffs = await prisma.flowDiff.findMany({
    where: { flowId },
    orderBy: { computedAt: "desc" },
    take: 5,
    include: {
      fromVersion: { select: { versionNumber: true } },
      toVersion: { select: { versionNumber: true } },
    },
  });

  const exportDate = new Date().toISOString().split("T")[0];

  const sections: string[] = [];

  // Title
  sections.push(`# ${version.flow.name} — v${version.versionNumber}`);
  sections.push("");
  sections.push(`**Platform:** ${version.flow.platform.replace("_", " ")}`);
  sections.push(`**Exported:** ${exportDate}`);
  sections.push(`**Nodes:** ${version.nodeCount} | **Edges:** ${version.edgeCount}`);
  sections.push("");

  // Flow Diagram
  sections.push("## Flow Diagram");
  sections.push("");
  sections.push("```mermaid");
  sections.push(mermaidDiagram);
  sections.push("```");
  sections.push("");

  // Node Reference
  sections.push("## Node Reference");
  sections.push("");
  sections.push("| ID | Type | Label | Audio Prompt |");
  sections.push("|----|------|-------|--------------|");
  for (const node of flow.nodes) {
    const audio = node.audioPrompt ?? "—";
    sections.push(`| ${node.id} | ${node.type} | ${node.label} | ${audio} |`);
  }
  sections.push("");

  // Change Log
  if (diffs.length > 0) {
    sections.push("## Change Log (last 5 versions)");
    sections.push("");
    for (const diff of diffs) {
      const date = diff.computedAt.toISOString().split("T")[0];
      const summary = [
        diff.addedNodes > 0 ? `+${diff.addedNodes} nodes` : "",
        diff.removedNodes > 0 ? `-${diff.removedNodes} nodes` : "",
        diff.addedEdges > 0 ? `+${diff.addedEdges} edges` : "",
        diff.removedEdges > 0 ? `-${diff.removedEdges} edges` : "",
        diff.modifiedNodes > 0 ? `${diff.modifiedNodes} modified` : "",
      ].filter(Boolean).join(", ");
      sections.push(
        `- v${diff.toVersion.versionNumber} ← v${diff.fromVersion.versionNumber}: ${summary} (${date})`
      );
    }
    sections.push("");
  }

  sections.push("---");
  sections.push("*Exported by [FlowTrace](https://app.flowtrace.io)*");

  return sections.join("\n");
}
