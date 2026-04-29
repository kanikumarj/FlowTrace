import { NormalizedFlowSchema, type NormalizedFlow } from "./types";

interface NormalizerResult {
  success: boolean;
  data: NormalizedFlow | null;
  errors: string[];
}

export function normalizeFlow(raw: unknown): NormalizerResult {
  const result = NormalizedFlowSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    return { success: false, data: null, errors };
  }

  const flow = result.data;

  // ─── Post-validation checks ────────────────────────────────
  const errors: string[] = [];
  const nodeIds = new Set(flow.nodes.map((n) => n.id));

  // Validate edge references
  for (const edge of flow.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references unknown source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references unknown target node: ${edge.target}`);
    }
  }

  // Check for START node
  const hasStart = flow.nodes.some((n) => n.type === "START");
  if (!hasStart) {
    errors.push("Flow is missing a START node");
  }

  // Check for duplicate node IDs
  if (nodeIds.size !== flow.nodes.length) {
    errors.push("Flow contains duplicate node IDs");
  }

  if (errors.length > 0) {
    return { success: false, data: flow, errors };
  }

  return { success: true, data: flow, errors: [] };
}
