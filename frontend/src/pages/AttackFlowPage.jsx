import AttackFlowGraph from "../components/AttackFlowGraph";

function AttackFlowPage({ attackFlow, onNodeSelect }) {
  return (
    <div className="page-stack">
      <section className="hero-glass smaller-hero">
        <p className="section-label">Visual Incident Story</p>
        <h1>Attack Flow</h1>
        <p>
          Instead of reading raw logs line by line, follow the incident as a visual
          sequence of actions and outcomes.
        </p>
      </section>

      <AttackFlowGraph attackFlow={attackFlow} onNodeSelect={onNodeSelect} />

      <section className="glass-panel compact-section">
        <p className="section-label">How to read this</p>
        <div className="legend-grid">
          <div>
            <span className="legend-dot warning-dot" />
            Warning means suspicious activity.
          </div>
          <div>
            <span className="legend-dot danger-dot" />
            High means possible compromise.
          </div>
          <div>
            <span className="legend-dot resolved-dot" />
            Resolved means the system contained the activity.
          </div>
        </div>
      </section>
    </div>
  );
}

export default AttackFlowPage;