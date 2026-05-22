import { Handle, Position } from "reactflow";
import { ShieldAlert, Lock, Ban, Globe2, KeyRound, FileWarning } from "lucide-react";

function getNodeIcon(type) {
  if (type === "source") return <Globe2 size={20} />;
  if (type === "failed_login") return <KeyRound size={20} />;
  if (type === "successful_login") return <ShieldAlert size={20} />;
  if (type === "file_access") return <FileWarning size={20} />;
  if (type === "permission_change") return <FileWarning size={20} />;
  if (type === "account_lock") return <Lock size={20} />;
  if (type === "ip_block") return <Ban size={20} />;
  return <ShieldAlert size={20} />;
}

function FlowNode({ data }) {
  return (
    <div className={`custom-flow-node severity-${data.severity}`}>
      <Handle type="target" position={Position.Left} className="flow-handle" />

      <div className="flow-node-header">
        <div className="flow-node-icon">{getNodeIcon(data.id)}</div>
        <span>{data.severity}</span>
      </div>

      <p>{data.label}</p>
      <strong>{data.value}</strong>

      <button onClick={data.onInspect}>Inspect</button>

      <Handle type="source" position={Position.Right} className="flow-handle" />
    </div>
  );
}

export default FlowNode;