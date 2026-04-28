"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";

import type { GraphPayload } from "@/lib/types";

export function GraphCanvas({ graph }: { graph: GraphPayload }) {
  const { nodes, edges } = useMemo(() => mapGraph(graph), [graph]);

  return (
    <ReactFlowProvider>
      <ReactFlow
        fitView
        nodes={nodes}
        edges={edges}
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
      >
        <MiniMap zoomable pannable />
        <Controls />
        <Background />
      </ReactFlow>
    </ReactFlowProvider>
  );
}

function mapGraph(graph: GraphPayload): { nodes: Node[]; edges: Edge[] } {
  const mappedNodes: Node[] = graph.nodes.map((node, index) => {
    const ring = node.kind === "contributor" ? 180 : 280;
    const angle = (index / Math.max(graph.nodes.length, 1)) * Math.PI * 2;
    return {
      id: node.id,
      data: { label: `${node.label} (${node.influence_score.toFixed(2)})` },
      position: {
        x: Math.cos(angle) * ring,
        y: Math.sin(angle) * ring,
      },
      style: {
        borderRadius: 8,
        padding: 8,
        border: "1px solid rgba(255,255,255,0.2)",
        background: node.kind === "contributor" ? "rgba(251,191,36,0.2)" : "rgba(148,163,184,0.2)",
        color: "#ffffff",
        fontSize: 12,
      },
    };
  });

  const mappedEdges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: `${edge.relation} (${edge.weight.toFixed(2)})`,
    style: { strokeWidth: Math.max(1.5, Math.min(edge.weight, 8)), stroke: "#f59e0b" },
    labelStyle: { fill: "#e2e8f0", fontSize: 10 },
  }));

  return { nodes: mappedNodes, edges: mappedEdges };
}
