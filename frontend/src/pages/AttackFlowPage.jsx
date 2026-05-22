import AttackFlowCanvas from "../components/flow/AttackFlowCanvas";

function AttackFlowPage({ attackFlow }) {
  return (
    <div className="flow-page-layout">
      <section className="dashboard-hero flow-hero">
        <div>
          <p className="section-label">Visual Incident Story</p>
          <h1>Attack Flow Intelligence</h1>
          <p>
            CivicShield converts Splunk evidence into an interactive attack graph
            so non-expert teams can see how the incident unfolded.
          </p>
        </div>

        <div className="hero-scenario-card">
          <span>Graph Mode</span>
          <strong>Node-Link Flow</strong>
          <p>Click nodes to inspect evidence</p>
        </div>
      </section>

      <AttackFlowCanvas attackFlow={attackFlow} />
    </div>
  );
}

export default AttackFlowPage;