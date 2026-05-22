import { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import FlowNode from "./FlowNode";
import NodeDetailPanel from "./NodeDetailPanel";
import FlowLegend from "./FlowLegend";

const nodeTypes = {
  customNode: FlowNode,
};

function getSeverityColor(severity) {
  if (severity === "high") return "#ef8f8f";
  if (severity === "warning") return "#f4b860";
  if (severity === "resolved") return "#7fd1ae";
  if (severity === "medium") return "#4f7cff";
  return "#94a3b8";
}

function buildReactFlowNodes(flowNodes, onSelectNode) {
  return flowNodes.map((node, index) => ({
    id: node.id,
    type: "customNode",
    position: {
      x: index * 310,
      y: index % 2 === 0 ? 80 : 230,
    },
    data: {
      ...node,
      onInspect: () => onSelectNode(node),
    },
  }));
}

function buildReactFlowEdges(flowEdges, flowNodes) {
  return flowEdges.map((edge, index) => {
    const targetNode = flowNodes.find((node) => node.id === edge.to);
    const color = getSeverityColor(targetNode?.severity);

    return {
      id: `edge-${index}`,
      source: edge.from,
      target: edge.to,
      animated: true,
      type: "smoothstep",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
      },
      style: {
        stroke: color,
        strokeWidth: 3,
      },
    };
  });
}

function AttackFlowCanvas({ attackFlow }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const reactFlowNodes = useMemo(() => {
    return buildReactFlowNodes(attackFlow?.nodes || [], setSelectedNode);
  }, [attackFlow]);

  const reactFlowEdges = useMemo(() => {
    return buildReactFlowEdges(attackFlow?.edges || [], attackFlow?.nodes || []);
  }, [attackFlow]);

  if (!attackFlow) return null;

  return (
    <section className="flow-workspace">
      <div className="flow-main-panel">
        <div className="panel-heading compact">
          <div>
            <p className="section-label">Interactive Attack Graph</p>
            <h2>{attackFlow.flow_title}</h2>
            <p className="flow-summary">{attackFlow.flow_summary}</p>
          </div>

          <span className="soft-pill">{attackFlow.node_count} nodes</span>
        </div>

        <FlowLegend />

        <div className="react-flow-shell">
          <ReactFlow
            nodes={reactFlowNodes}
            edges={reactFlowEdges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.22 }}
          >
            <Background gap={22} size={1} color="rgba(100,116,139,0.25)" />
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) => getSeverityColor(node.data?.severity)}
            />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      <NodeDetailPanel selectedNode={selectedNode} />
    </section>
  );
}

export default AttackFlowCanvas;