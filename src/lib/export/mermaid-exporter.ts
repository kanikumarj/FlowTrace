// ─── Mermaid Exporter ────────────────────────────────────────
// Converts a NormalizedFlow into Mermaid flowchart syntax.

import type { NormalizedFlow, NormalizedNode } from "@/lib/parsers/types";

export function generateMermaid(flow: NormalizedFlow): string {
  const lines: string[] = ["flowchart TD"];

  // Node definitions
  for (const node of flow.nodes) {
    const label = truncateLabel(node.label, 30);
    const typeSuffix = `\\n(${node.type})`;
    const nodeStr = formatNodeShape(node, `${label}${typeSuffix}`);
    lines.push(`    ${nodeStr}`);
  }

  lines.push("");

  // Edge definitions
  for (const edge of flow.edges) {
    const edgeLabel = edge.label ? `|"${escapeQuotes(edge.label)}"| ` : "";
    lines.push(`    ${edge.source} -->${edgeLabel}${edge.target}`);
  }

  lines.push("");

  // Node styles based on type
  for (const node of flow.nodes) {
    const style = getNodeStyle(node.type);
    if (style) {
      lines.push(`    style ${node.id} ${style}`);
    }
  }

  return lines.join("\n");
}

function formatNodeShape(node: NormalizedNode, label: string): string {
  const escaped = escapeQuotes(label);
  switch (node.type) {
    case "CONDITION":
      return `${node.id}{"${escaped}"}`;
    case "START":
      return `${node.id}(["${escaped}"])`;
    case "HANGUP":
      return `${node.id}[/"${escaped}"/]`;
    default:
      return `${node.id}["${escaped}"]`;
  }
}

function getNodeStyle(type: string): string | null {
  switch (type) {
    case "START":
      return "fill:#22c55e,stroke:#16a34a,color:#fff";
    case "HANGUP":
      return "fill:#ef4444,stroke:#dc2626,color:#fff";
    case "QUEUE":
      return "fill:#0d9488,stroke:#0f766e,color:#fff";
    case "TRANSFER":
      return "fill:#a855f7,stroke:#9333ea,color:#fff";
    case "MENU":
      return "fill:#3b82f6,stroke:#2563eb,color:#fff";
    case "CONDITION":
      return "fill:#f59e0b,stroke:#d97706,color:#fff";
    case "VOICEMAIL":
      return "fill:#6366f1,stroke:#4f46e5,color:#fff";
    default:
      return null;
  }
}

function truncateLabel(label: string, max: number): string {
  if (label.length <= max) return label;
  return label.substring(0, max - 1) + "…";
}

function escapeQuotes(str: string): string {
  return str.replace(/"/g, "&quot;");
}
