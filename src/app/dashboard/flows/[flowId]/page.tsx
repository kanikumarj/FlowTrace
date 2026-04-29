import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FlowCanvasWrapper } from "./canvas-wrapper";

export default async function FlowPage({
  params,
}: {
  params: { flowId: string };
}) {
  const flow = await prisma.flow.findUnique({
    where: { id: params.flowId },
    include: {
      nodes: true,
      edges: true,
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!flow) notFound();

  const flowData = {
    id: flow.id,
    name: flow.name,
    platform: flow.platform,
    status: flow.status,
    nodeCount: flow.nodeCount,
    createdBy: flow.createdBy,
    nodes: flow.nodes.map((n) => ({
      nodeId: n.nodeId,
      type: n.type,
      label: n.label,
      metadata: n.metadata as Record<string, unknown>,
      positionX: n.positionX,
      positionY: n.positionY,
    })),
    edges: flow.edges.map((e) => ({
      sourceNodeId: e.sourceNodeId,
      targetNodeId: e.targetNodeId,
      label: e.label,
      condition: e.condition,
    })),
  };

  return <FlowCanvasWrapper flow={flowData} />;
}
