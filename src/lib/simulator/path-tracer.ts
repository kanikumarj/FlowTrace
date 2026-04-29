// ─── Call Path Simulator ─────────────────────────────────────
import type { NormalizedFlow, NormalizedNode, NormalizedEdge } from "@/lib/parsers/types";

export interface SimulatorInput {
  dnis?: string;
  timeOfDay?: string;
  callerType?: string;
}

export interface FlowIssue {
  type: string;
  nodeId?: string;
  label?: string;
  message?: string;
  path?: string[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
}

export interface TraceResult {
  path: string[];
  outcome: "REACHED_QUEUE" | "HANGUP" | "DEAD_END" | "LOOP_DETECTED" | "ERROR";
  outcomeLabel: string;
  totalSteps: number;
  issues: FlowIssue[];
}

const MAX_STEPS = 50;

export function traceCall(flow: NormalizedFlow, input: SimulatorInput): TraceResult {
  const path: string[] = [];
  const issues: FlowIssue[] = [];

  const nodesMap = new Map<string, NormalizedNode>();
  flow.nodes.forEach((n) => nodesMap.set(n.id, n));

  const edgesBySource = new Map<string, NormalizedEdge[]>();
  flow.edges.forEach((edge) => {
    const list = edgesBySource.get(edge.source) || [];
    list.push(edge);
    edgesBySource.set(edge.source, list);
  });

  let currentNode: NormalizedNode | undefined = flow.nodes.find((n) => n.type === "START");

  if (!currentNode) {
    return {
      path: [],
      outcome: "ERROR",
      outcomeLabel: "No START node found",
      totalSteps: 0,
      issues: [{ type: "NO_START", severity: "CRITICAL" }],
    };
  }

  const visitedCount = new Map<string, number>();

  while (currentNode) {
    const count = visitedCount.get(currentNode.id) || 0;
    if (path.length >= MAX_STEPS || count >= 2) {
      const loopPath = [...path, currentNode.id];
      issues.push({ type: "LOOP", path: loopPath, severity: "CRITICAL" });
      return {
        path: loopPath,
        outcome: "LOOP_DETECTED",
        outcomeLabel: "Loop detected",
        totalSteps: loopPath.length,
        issues,
      };
    }

    path.push(currentNode.id);
    visitedCount.set(currentNode.id, count + 1);

    // Terminal nodes
    if (["HANGUP", "TRANSFER", "QUEUE", "VOICEMAIL"].includes(currentNode.type)) {
      const outcome = ["QUEUE", "TRANSFER"].includes(currentNode.type) ? "REACHED_QUEUE" : "HANGUP";
      return {
        path,
        outcome,
        outcomeLabel: currentNode.label,
        totalSteps: path.length,
        issues,
      };
    }

    const outgoing: NormalizedEdge[] = edgesBySource.get(currentNode.id) || [];

    if (outgoing.length === 0) {
      issues.push({ type: "DEAD_END", nodeId: currentNode.id, label: currentNode.label, severity: "HIGH" });
      return {
        path,
        outcome: "DEAD_END",
        outcomeLabel: `Dead end at ${currentNode.label}`,
        totalSteps: path.length,
        issues,
      };
    }

    let nextEdge: NormalizedEdge = outgoing[0];

    // Follow condition-based edges if caller type matches
    if (currentNode.type === "CONDITION" && input.callerType) {
      const callerLower = input.callerType.toLowerCase();
      const match = outgoing.find(
        (e) =>
          e.label.toLowerCase().includes(callerLower) ||
          (e.condition?.toLowerCase().includes(callerLower) ?? false)
      );
      if (match) nextEdge = match;
    }

    const nextNodeId: string = nextEdge.target;
    currentNode = nodesMap.get(nextNodeId);

    if (!currentNode) {
      issues.push({ type: "ERROR", severity: "CRITICAL", message: `Unknown target ${nextNodeId}` });
      return {
        path,
        outcome: "ERROR",
        outcomeLabel: "Broken edge reference",
        totalSteps: path.length,
        issues,
      };
    }
  }

  return {
    path,
    outcome: "ERROR",
    outcomeLabel: "Unexpected termination",
    totalSteps: path.length,
    issues,
  };
}
