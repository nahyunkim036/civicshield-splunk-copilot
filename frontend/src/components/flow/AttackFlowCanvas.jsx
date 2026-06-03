import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import FlowNode from "./FlowNode";
import NodeDetailPanel from "./NodeDetailPanel";

const nodeTypes = {
  customNode: FlowNode,
};

function getSeverityColor(severity) {
  if (severity === "critical") return "#ffffff";
  if (severity === "high") return "#ffffff";
  if (severity === "warning") return "#a3a3a3";
  if (severity === "resolved") return "#ffffff";
  if (severity === "medium") return "#d4d4d4";
  return "#737373";
}

function buildReactFlowNodes(movieNodes, visibleCount, onSelectNode) {
  return movieNodes.slice(0, visibleCount).map((node, index) => ({
    id: node.id,
    type: "customNode",
    position: {
      x: index * 290,
      y: index % 2 === 0 ? 80 : 230,
    },
    data: {
      ...node,
      onInspect: () => onSelectNode(node),
    },
  }));
}

function buildReactFlowEdges(movieEdges, movieNodes, visibleCount) {
  const visibleNodeIds = new Set(
    movieNodes.slice(0, visibleCount).map((node) => node.id)
  );

  return movieEdges
    .filter((edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to))
    .map((edge, index) => {
      const targetNode = movieNodes.find((node) => node.id === edge.to);
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
          strokeWidth: 2,
        },
      };
    });
}

function AttackFlowCanvas({ attackMovie }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalNodes = attackMovie?.nodes?.length || 0;
  const visibleCount = Math.min(currentStep, totalNodes || 1);
  const currentStage = attackMovie?.nodes?.[currentStep - 1];

  useEffect(() => {
    if (!isPlaying) return;

    if (currentStep >= totalNodes) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((step) => Math.min(step + 1, totalNodes));
    }, 1100);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, totalNodes]);

  const reactFlowNodes = useMemo(() => {
    return buildReactFlowNodes(
      attackMovie?.nodes || [],
      visibleCount,
      setSelectedNode
    );
  }, [attackMovie, visibleCount]);

  const reactFlowEdges = useMemo(() => {
    return buildReactFlowEdges(
      attackMovie?.edges || [],
      attackMovie?.nodes || [],
      visibleCount
    );
  }, [attackMovie, visibleCount]);

  if (!attackMovie) return null;

  function handlePlayPause() {
    setIsPlaying((value) => !value);
  }

  function handleReset() {
    setIsPlaying(false);
    setCurrentStep(1);
    setSelectedNode(null);
  }

  function handleNext() {
    setIsPlaying(false);
    setCurrentStep((step) => Math.min(step + 1, totalNodes));
  }

  const progressPercent =
    totalNodes > 1 ? ((visibleCount - 1) / (totalNodes - 1)) * 100 : 0;

  return (
    <section className="movie-canvas-layout">
      <div className="movie-main-panel">
        <div className="movie-control-bar">
          <div>
            <p className="eyebrow">Replay Engine</p>
            <h2>{attackMovie.title}</h2>
          </div>

          <div className="movie-buttons">
            <button className="primary-action" onClick={handlePlayPause}>
              {isPlaying ? "Pause" : "Play"}
            </button>

            <button className="secondary-action" onClick={handleNext}>
              Next
            </button>

            <button className="secondary-action" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>

        <div className="movie-progress">
          <div style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="current-stage-panel">
          <span>
            {currentStage?.time || "--"} · {currentStage?.stage || "Replay"}
          </span>
          <strong>{currentStage?.headline || "Ready to replay episode"}</strong>
          <p>{currentStage?.description || attackMovie.summary}</p>
        </div>

        <div className="react-flow-shell">
          <ReactFlow
            nodes={reactFlowNodes}
            edges={reactFlowEdges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.24 }}
          >
            <Background gap={24} size={1} color="rgba(255,255,255,0.08)" />
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