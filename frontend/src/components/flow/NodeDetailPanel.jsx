function NodeDetailPanel({ selectedNode }) {
  if (!selectedNode) {
    return (
      <aside className="node-detail-panel empty-detail">
        <p className="section-label">Node Detail</p>
        <h2>Select a step</h2>
        <p>
          Click any node in the attack graph to inspect why CivicShield included
          it in the incident flow.
        </p>
      </aside>
    );
  }

  return (
    <aside className="node-detail-panel">
      <p className="section-label">Selected Step</p>
      <h2>{selectedNode.label}</h2>

      <div className={`detail-severity severity-pill-${selectedNode.severity}`}>
        {selectedNode.severity}
      </div>

      <div className="detail-section">
        <span>Observed Value</span>
        <strong>{selectedNode.value}</strong>
      </div>

      <div className="detail-section">
        <span>Why this matters</span>
        <p>{selectedNode.description}</p>
      </div>

      <div className="detail-section">
        <span>Investigation Hint</span>
        <p>
          Compare this step with nearby events in the evidence timeline to confirm
          whether the behavior is isolated or part of a larger sequence.
        </p>
      </div>
    </aside>
  );
}

export default NodeDetailPanel;