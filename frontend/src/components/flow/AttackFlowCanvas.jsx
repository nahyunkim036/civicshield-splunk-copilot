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
  if (severity === "high") return "#fb7185";
  if (severity === "warning") return "#facc15";
  if (severity === "resolved") return "#34d399";
  if (severity === "medium") return "#60a5fa";
  return "#94a3b8";
}

function buildReactFlowNodes(flowNodes, visibleCount, onSelectNode) {
  return flowNodes.slice(0, visibleCount).map((node, index) => ({
    id: node.id,
    type: "customNode",
    position: {
      x: index * 300,
      y: index % 2 === 0 ? 90 : 245,
    },
    data: {
      ...node,
      onInspect: () => onSelectNode(node),
    },
  }));
}

function buildReactFlowEdges(flowEdges, flowNodes, visibleCount) {
  const visibleNodeIds = new Set(
    flowNodes.slice(0, visibleCount).map((node) => node.id)
  );

  return flowEdges
    .filter((edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to))
    .map((edge, index) => {
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

function getStageLabel(story, currentStep) {
  const timeline = story?.timeline || [];
  const stage = timeline[currentStep - 1];

  if (!stage) {
    return {
      stage: "Incident Replay",
      headline: "Play the attack movie to reveal the incident path.",
      time: "--",
      severity: "medium",
    };
  }

  return stage;
}

function AttackFlowCanvas({ attackFlow, story }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalNodes = attackFlow?.nodes?.length || 0;
  const visibleCount = Math.min(currentStep, totalNodes || 1);
  const currentStage = getStageLabel(story, currentStep);

  useEffect(() => {
    if (!isPlaying) return;

    if (currentStep >= totalNodes) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((step) => Math.min(step + 1, totalNodes));
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, totalNodes]);

  const reactFlowNodes = useMemo(() => {
    return buildReactFlowNodes(
      attackFlow?.nodes || [],
      visibleCount,
      setSelectedNode
    );
  }, [attackFlow, visibleCount]);

  const reactFlowEdges = useMemo(() => {
    return buildReactFlowEdges(
      attackFlow?.edges || [],
      attackFlow?.nodes || [],
      visibleCount
    );
  }, [attackFlow, visibleCount]);

  if (!attackFlow) return null;

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
            <h2>{attackFlow.flow_title}</h2>
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
          <span>{currentStage.time}</span>
          <strong>{currentStage.headline || currentStage.stage}</strong>
          <p>{currentStage.narration}</p>
        </div>

        <div className="react-flow-shell">
          <ReactFlow
            nodes={reactFlowNodes}
            edges={reactFlowEdges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.24 }}
          >
            <Background gap={24} size={1} color="rgba(148,163,184,0.18)" />
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