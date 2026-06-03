function NodeDetailPanel({ selectedNode }) {
  if (!selectedNode) {
    return (
      <aside className="node-detail-panel empty-detail">
        <p className="eyebrow">Evidence Inspector</p>
        <h2>Select a stage</h2>
        <p>Click a node in the attack movie to inspect the Splunk-backed evidence.</p>
      </aside>
    );
  }

  const evidence = selectedNode.evidence || {};

  return (
    <aside className="node-detail-panel">
      <p className="eyebrow">Evidence Inspector</p>
      <h2>{selectedNode.stage}</h2>

      <div className="detail-section">
        <span>Signal</span>
        <strong>{selectedNode.risk_signal}</strong>
      </div>

      <div className="detail-section">
        <span>Timestamp</span>
        <strong>{evidence.timestamp}</strong>
      </div>

      <div className="detail-section">
        <span>Pod</span>
        <strong>{evidence.pod}</strong>
      </div>

      <div className="detail-section">
        <span>Process</span>
        <strong>{evidence.process || "—"}</strong>
      </div>

      <div className="detail-section">
        <span>Destination IP</span>
        <strong>{evidence.dest_ip || "—"}</strong>
      </div>

      <div className="detail-section">
        <span>File Path</span>
        <p>{evidence.file_path || "—"}</p>
      </div>
    </aside>
  );
}

export default NodeDetailPanel;