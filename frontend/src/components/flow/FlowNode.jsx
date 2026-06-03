import { Handle, Position } from "reactflow";

function FlowNode({ data }) {
  return (
    <div className={`custom-flow-node severity-${data.severity}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="flow-handle"
      />

      <div className="flow-node-top">
        <span>{String(data.step).padStart(2, "0")}</span>
        <small>{data.severity}</small>
      </div>

      <p>{data.stage}</p>
      <strong>{data.headline || data.label}</strong>

      <button onClick={data.onInspect}>Inspect Evidence</button>

      <Handle
        type="source"
        position={Position.Right}
        className="flow-handle"
      />
    </div>
  );
}

export default FlowNode;