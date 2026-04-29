import { NormalizedFlow, NormalizedNode } from "@/lib/parsers/types";
import { traceCall } from "./path-tracer";

export function analyzeFlow(flow: NormalizedFlow) {
  const issues: any[] = [];
  const nodesMap = new Map<string, NormalizedNode>(flow.nodes.map(n => [n.id, n]));
  const incomingEdges = new Map<string, number>();
  const outgoingEdges = new Map<string, number>();

  flow.nodes.forEach(n => {
    incomingEdges.set(n.id, 0);
    outgoingEdges.set(n.id, 0);
  });

  flow.edges.forEach(e => {
    outgoingEdges.set(e.source, (outgoingEdges.get(e.source) || 0) + 1);
    incomingEdges.set(e.target, (incomingEdges.get(e.target) || 0) + 1);
  });

  flow.nodes.forEach(node => {
    // DEAD_END: Node has no outgoing edges and is not HANGUP/TRANSFER/QUEUE/VOICEMAIL
    const isTerminal = ["HANGUP", "TRANSFER", "QUEUE", "VOICEMAIL"].includes(node.type);
    const outs = outgoingEdges.get(node.id) || 0;
    
    if (!isTerminal && outs === 0) {
      issues.push({ type: "DEAD_END", nodeId: node.id, label: node.label, severity: "HIGH" });
    }

    // UNREACHABLE_NODE: Node has no incoming edges and is not START
    const ins = incomingEdges.get(node.id) || 0;
    if (node.type !== "START" && ins === 0) {
      issues.push({ type: "UNREACHABLE", nodeId: node.id, label: node.label, severity: "MEDIUM" });
    }

    // MISSING_DEFAULT_PATH: MENU node has DTMF options but no "no input" / "invalid" edge
    if (node.type === "MENU") {
      const edges = flow.edges.filter(e => e.source === node.id);
      const hasDefault = edges.some(e => e.label.toLowerCase() === "default" || e.label.toLowerCase() === "invalid" || e.label.toLowerCase() === "timeout");
      if (!hasDefault && edges.length > 0) {
        issues.push({ type: "MISSING_DEFAULT", nodeId: node.id, label: node.label, severity: "HIGH" });
      }
    }
  });

  // LOOP_DETECTED: run a trace from start with empty input to see if naive loop exists
  const trace = traceCall(flow, {});
  const loopIssue = trace.issues.find(i => i.type === "LOOP");
  if (loopIssue) {
    issues.push(loopIssue);
  }

  return {
    issues,
    issueCount: issues.length,
    criticalCount: issues.filter(i => i.severity === "CRITICAL").length
  };
}
