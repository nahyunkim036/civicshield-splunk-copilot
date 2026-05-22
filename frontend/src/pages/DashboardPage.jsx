import { getPatternExplanation, getRiskTone } from "../utils/statusUtils";

function DashboardPage({ analysis, attackFlow, logs, onShowDetails, onTabChange }) {
  if (!analysis) return null;

  const threatPersona = analysis.threat_persona || {};
  const topPatterns = analysis.detected_patterns?.slice(0, 3) || [];
  const riskTone = getRiskTone(analysis.risk_level);

  return (
    <div className="page-stack">
      <section className="hero-glass">
        <p className="section-label">Security Copilot</p>
        <h1>Incident Review Dashboard</h1>
        <p>
          A cleaner way to understand suspicious Splunk activity through incident
          summaries, attack flow diagrams, and evidence.
        </p>
      </section>

      <section className="metric-grid">
        <article className={`metric-card tone-${riskTone}`}>
          <p>Risk Level</p>
          <strong>{analysis.risk_level}</strong>
          <span>{analysis.incident_type}</span>
        </article>

        <article className="metric-card">
          <p>Events Analyzed</p>
          <strong>{analysis.total_events_analyzed}</strong>
          <span>From Splunk index</span>
        </article>

        <article className="metric-card">
          <p>Evidence Items</p>
          <strong>{analysis.evidence_count}</strong>
          <span>Used for detection</span>
        </article>

        <article className="metric-card">
          <p>Confidence</p>
          <strong>{analysis.confidence}</strong>
          <span>Rule-based estimate</span>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="glass-panel primary-summary">
          <div className="panel-heading">
            <div>
              <p className="section-label">Incident Summary</p>
              <h2>{analysis.incident_type}</h2>
            </div>

            <button
              className="ghost-button"
              onClick={() =>
                onShowDetails({
                  title: "Incident Summary",
                  body: analysis.summary,
                })
              }
            >
              More detail
            </button>
          </div>

          <p className="large-summary">{analysis.summary}</p>

          <div className="mini-flow-preview">
            <span>{attackFlow?.nodes?.[0]?.label || "Source"}</span>
            <span>→</span>
            <span>{attackFlow?.nodes?.[1]?.label || "Activity"}</span>
            <span>→</span>
            <span>{attackFlow?.nodes?.at(-1)?.label || "Outcome"}</span>
          </div>

          <button className="primary-button" onClick={() => onTabChange("attack-flow")}>
            View attack flow
          </button>
        </article>

        <article className="glass-panel persona-card">
          <p className="section-label">Threat Persona</p>
          <div className="persona-face">⚡</div>
          <h2>{threatPersona.name || "Unknown"}</h2>
          <p>{threatPersona.behavior || "No behavior classified yet."}</p>

          <button
            className="ghost-button"
            onClick={() =>
              onShowDetails({
                title: threatPersona.name || "Threat Persona",
                body: threatPersona.intent || "No intent available.",
              })
            }
          >
            View intent
          </button>
        </article>
      </section>

      <section className="glass-panel compact-section">
        <div className="panel-heading">
          <div>
            <p className="section-label">Detected Patterns</p>
            <h2>What CivicShield noticed</h2>
          </div>
          <span className="soft-pill">{topPatterns.length} highlights</span>
        </div>

        <div className="pattern-strip">
          {topPatterns.map((pattern, index) => (
            <button
              key={pattern}
              className="pattern-chip"
              onClick={() =>
                onShowDetails({
                  title: pattern,
                  body: getPatternExplanation(pattern),
                })
              }
            >
              <span>{index + 1}</span>
              {pattern}
            </button>
          ))}
        </div>
      </section>

      <section className="glass-panel compact-section">
        <div className="panel-heading">
          <div>
            <p className="section-label">Recommended Actions</p>
            <h2>Next best steps</h2>
          </div>
          <button className="ghost-button" onClick={() => onTabChange("evidence")}>
            View evidence
          </button>
        </div>

        <div className="action-preview">
          {analysis.recommended_actions?.slice(0, 3).map((action, index) => (
            <div className="action-row" key={action}>
              <span>{index + 1}</span>
              <p>{action}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;