// ─── Semantic Diff Engine ────────────────────────────────────
import { prisma } from "@/lib/prisma";
import type { FlowVersion, FlowDiff } from "@prisma/client";
import type { NormalizedFlow, NormalizedNode, NormalizedEdge } from "@/lib/parsers/types";

interface DiffNodeEntry {
  id: string;
  type: string;
  label: string;
  changes?: Array<{ field: string; before: unknown; after: unknown }>;
}

interface DiffEdgeEntry {
  source: string;
  target: string;
  label: string;
}

export async function computeDiff(fromVersion: FlowVersion, toVersion: FlowVersion): Promise<FlowDiff> {
  const existingDiff = await prisma.flowDiff.findUnique({
    where: {
      fromVersionId_toVersionId: {
        fromVersionId: fromVersion.id,
        toVersionId: toVersion.id,
      },
    },
  });

  if (existingDiff) return existingDiff;

  const fromFlow = fromVersion.normalizedJson as unknown as NormalizedFlow;
  const toFlow = toVersion.normalizedJson as unknown as NormalizedFlow;

  const addedNodes: DiffNodeEntry[] = [];
  const removedNodes: DiffNodeEntry[] = [];
  const modifiedNodes: DiffNodeEntry[] = [];
  const addedEdges: DiffEdgeEntry[] = [];
  const removedEdges: DiffEdgeEntry[] = [];

  // Build node lookup maps
  const fromNodesMap = new Map<string, NormalizedNode>();
  const toNodesMap = new Map<string, NormalizedNode>();
  fromFlow.nodes.forEach((n) => fromNodesMap.set(n.id, n));
  toFlow.nodes.forEach((n) => toNodesMap.set(n.id, n));

  // Compare nodes
  toFlow.nodes.forEach((toNode) => {
    const fromNode = fromNodesMap.get(toNode.id);
    if (!fromNode) {
      addedNodes.push({ id: toNode.id, type: toNode.type, label: toNode.label });
    } else {
      const changes: Array<{ field: string; before: unknown; after: unknown }> = [];
      const allKeys = new Set<string>();
      Object.keys(toNode).forEach((k) => allKeys.add(k));
      Object.keys(fromNode).forEach((k) => allKeys.add(k));

      allKeys.forEach((key) => {
        const toVal = (toNode as Record<string, unknown>)[key];
        const fromVal = (fromNode as Record<string, unknown>)[key];
        if (JSON.stringify(toVal) !== JSON.stringify(fromVal)) {
          changes.push({ field: key, before: fromVal, after: toVal });
        }
      });

      if (changes.length > 0) {
        modifiedNodes.push({ id: toNode.id, type: toNode.type, label: toNode.label, changes });
      }
    }
  });

  fromFlow.nodes.forEach((fromNode) => {
    if (!toNodesMap.has(fromNode.id)) {
      removedNodes.push({ id: fromNode.id, type: fromNode.type, label: fromNode.label });
    }
  });

  // Compare edges
  const edgeKey = (e: NormalizedEdge): string => `${e.source}->${e.target}`;
  const fromEdgesMap = new Map<string, NormalizedEdge>();
  const toEdgesMap = new Map<string, NormalizedEdge>();
  fromFlow.edges.forEach((e) => fromEdgesMap.set(edgeKey(e), e));
  toFlow.edges.forEach((e) => toEdgesMap.set(edgeKey(e), e));

  toFlow.edges.forEach((toEdge) => {
    if (!fromEdgesMap.has(edgeKey(toEdge))) {
      addedEdges.push({ source: toEdge.source, target: toEdge.target, label: toEdge.label });
    }
  });

  fromFlow.edges.forEach((fromEdge) => {
    if (!toEdgesMap.has(edgeKey(fromEdge))) {
      removedEdges.push({ source: fromEdge.source, target: fromEdge.target, label: fromEdge.label });
    }
  });

  const diffJson = {
    nodes: { added: addedNodes, removed: removedNodes, modified: modifiedNodes },
    edges: { added: addedEdges, removed: removedEdges, modified: [] as DiffEdgeEntry[] },
  };

  const diff = await prisma.flowDiff.create({
    data: {
      flowId: fromVersion.flowId,
      fromVersionId: fromVersion.id,
      toVersionId: toVersion.id,
      diffJson: JSON.parse(JSON.stringify(diffJson)),
      addedNodes: addedNodes.length,
      removedNodes: removedNodes.length,
      modifiedNodes: modifiedNodes.length,
      addedEdges: addedEdges.length,
      removedEdges: removedEdges.length,
    },
  });

  return diff;
}
