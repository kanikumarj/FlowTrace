"use client";

import { useCallback, useRef, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  type OnNodesChange,
  BackgroundVariant,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { nodeTypes } from "./nodes";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { useState } from "react";

interface FlowData {
  id: string;
  name: string;
  platform: string;
  nodeCount: number;
  nodes: Array<{
    nodeId: string;
    type: string;
    label: string;
    metadata: Record<string, unknown>;
    positionX: number;
    positionY: number;
  }>;
  edges: Array<{
    sourceNodeId: string;
    targetNodeId: string;
    label: string;
    condition?: string | null;
  }>;
}

function layoutWithDagre(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 100 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 200, height: 80 });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return { ...node, position: { x: pos.x - 100, y: pos.y - 40 } };
  });
}

export function FlowCanvas({ 
  flow, 
  highlightPath, 
  diffMode 
}: { 
  flow: FlowData, 
  highlightPath?: string[], 
  diffMode?: any 
}) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { initialNodes, initialEdges } = useMemo(() => {
    const hasPositions = flow.nodes.some((n) => n.positionX !== 0 || n.positionY !== 0);

    const rfNodes: Node[] = flow.nodes.map((n) => {
      const isPath = highlightPath ? highlightPath.includes(n.nodeId) : true;
      const isFinal = highlightPath ? highlightPath[highlightPath.length - 1] === n.nodeId : false;
      const isSuccess = isFinal && ["QUEUE", "TRANSFER"].includes(n.type);
      
      let diffStyle = {};
      if (diffMode) {
        if (diffMode.nodes?.added?.some((a: any) => a.id === n.nodeId)) diffStyle = { border: "2px solid #10b981", boxShadow: "0 0 10px #10b981" };
        else if (diffMode.nodes?.removed?.some((r: any) => r.id === n.nodeId)) diffStyle = { border: "2px solid #ef4444", boxShadow: "0 0 10px #ef4444", opacity: 0.5 };
        else if (diffMode.nodes?.modified?.some((m: any) => m.id === n.nodeId)) diffStyle = { border: "2px solid #eab308", boxShadow: "0 0 10px #eab308" };
      }

      return {
        id: n.nodeId,
        type: n.type,
        position: { x: n.positionX, y: n.positionY },
        style: {
          opacity: isPath ? 1 : 0.4,
          boxShadow: isFinal ? (isSuccess ? "0 0 20px #10b981" : "0 0 20px #ef4444") : (highlightPath && isPath ? "0 0 15px #3b82f6" : undefined),
          ...diffStyle
        },
        data: {
          label: n.label,
          audioPrompt: (n.metadata as Record<string, unknown>)?.audioPrompt,
          metadata: n.metadata,
        },
      };
    });

    const rfEdges: Edge[] = flow.edges.map((e, i) => {
      const sourceIdx = highlightPath ? highlightPath.indexOf(e.sourceNodeId) : -1;
      const targetIdx = highlightPath ? highlightPath.indexOf(e.targetNodeId) : -1;
      const isPathEdge = highlightPath ? sourceIdx !== -1 && targetIdx !== -1 && targetIdx === sourceIdx + 1 : false;

      let diffStyle = {};
      if (diffMode) {
        const key = `${e.sourceNodeId}->${e.targetNodeId}`;
        if (diffMode.edges?.added?.some((a: any) => `${a.source}->${a.target}` === key)) diffStyle = { stroke: "#10b981", strokeWidth: 2 };
        else if (diffMode.edges?.removed?.some((r: any) => `${r.source}->${r.target}` === key)) diffStyle = { stroke: "#ef4444", strokeWidth: 2, strokeDasharray: "5,5" };
      }

      return {
        id: `edge-${i}`,
        source: e.sourceNodeId,
        target: e.targetNodeId,
        label: e.label || undefined,
        animated: isPathEdge,
        style: { stroke: isPathEdge ? "#3b82f6" : "#475569", strokeWidth: isPathEdge ? 2 : 1.5, opacity: (highlightPath && !isPathEdge) ? 0.2 : 1, ...diffStyle },
        labelStyle: { fill: "#94a3b8", fontSize: 10, fontWeight: 500 },
        labelBgStyle: { fill: "#0f172a", fillOpacity: 0.9 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: isPathEdge ? "#3b82f6" : "#475569" },
      };
    });

    const laid = hasPositions ? rfNodes : layoutWithDagre(rfNodes, rfEdges);
    return { initialNodes: laid, initialEdges: rfEdges };
  }, [flow, highlightPath, diffMode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const savePositions = useCallback((updatedNodes: Node[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const updates = updatedNodes.map((n) => ({
        nodeId: n.id,
        positionX: n.position.x,
        positionY: n.position.y,
      }));
      try {
        await fetch(`/api/flows/${flow.id}/nodes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        });
      } catch (err) {
        console.error("Failed to save positions", err);
      }
    }, 1000);
  }, [flow.id]);

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      const hasDrag = changes.some((c) => c.type === "position" && c.dragging === false);
      if (hasDrag) {
        setNodes((nds) => {
          savePositions(nds);
          return nds;
        });
      }
    },
    [onNodesChange, savePositions, setNodes]
  );

  return (
    <div className="relative flex h-full">
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => setSelectedNode(node)}
          onPaneClick={() => setSelectedNode(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
          <Controls
            className="!border-border !bg-card !shadow-lg [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground [&>button:hover]:!bg-accent"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => {
              const colors: Record<string, string> = {
                START: "#10b981", MENU: "#3b82f6", PROMPT: "#64748b",
                CONDITION: "#f59e0b", TRANSFER: "#a855f7", API_CALL: "#f97316",
                QUEUE: "#14b8a6", HANGUP: "#ef4444", VOICEMAIL: "#6366f1", UNKNOWN: "#71717a",
              };
              return colors[node.type || ""] || "#71717a";
            }}
            maskColor="rgba(0,0,0,0.7)"
            className="!border-border !bg-card/80"
          />
        </ReactFlow>
      </div>
      {selectedNode && (
        <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}
