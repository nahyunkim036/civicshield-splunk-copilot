function AttackFlowGraph({ attackFlow, onNodeSelect }) {
  if (!attackFlow) return null;

  return (
    <section className="glass-panel attack-graph-panel">
      <div className="panel-heading">
        <div>
          <p className="section-label">Attack Flow Diagram</p>
          <h2>{attackFlow.flow_title}</h2>
        </div>

        <span className="soft-pill">{attackFlow.node_count} steps</span>
      </div>

      <div className="flow-canvas">
        <div className="flow-line" />

        {attackFlow.nodes?.map((node, index) => (
          <div className="flow-item" key={node.id}>
            <button
              className={`flow-node severity-${node.severity}`}
              onClick={() => onNodeSelect(node)}
            >
              <span className="node-index">{index + 1}</span>
              <span className="node-label">{node.label}</span>
              <strong>{node.value}</strong>
              <span className="node-severity">{node.severity}</span>
            </button>

            {index < attackFlow.nodes.length - 1 && (
              <div className="flow-connector">
                <span />
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="flow-hint">
        Click a step to inspect the evidence behind that part of the incident.
      </p>
    </section>
  );
}

export default AttackFlowGraph;