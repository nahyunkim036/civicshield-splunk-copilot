function InfoRow({ label, value, helper }) {
  return (
    <div className="info-row">
      <div>
        <span className="info-label">{label}</span>
        {helper && <p className="info-helper">{helper}</p>}
      </div>
      <strong>{value || "unknown"}</strong>
    </div>
  );
}

function SignalPill({ signal }) {
  return <span className="signal-pill">{signal}</span>;
}

function CaseOverviewPage({
  episodeData,
  episode,
  aiExplanation,
  auditData,
  onTabChange,
}) {
  const source = episodeData?.source || "splunk";
  const index = episodeData?.index || "civic_supply_chain_logs";
  const eventCount = episodeData?.total_events_analyzed || episode?.event_count || 0;

  const riskLevel = episode?.risk_level || "Unknown";
  const containment = episode?.containment || "Unknown";

  return (
    <div className="page-stack">
      <section className="case-hero">
        <div className="case-hero-main">
          <p className="eyebrow">Case Overview</p>
          <h2>{episode?.episode_title || "Supply Chain Incident Case"}</h2>
          <p className="case-summary">
            {aiExplanation?.case_summary ||
              "CivicShield analyzed Splunk evidence and built an incident case."}
          </p>

          <div className="case-actions">
            <button
              className="primary-action"
              type="button"
              onClick={() => onTabChange("timeline")}
            >
              Review Evidence Timeline
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={() => onTabChange("containment")}
            >
              Open Containment Actions
            </button>
          </div>
        </div>

        <aside className="case-status-panel">
          <div className="status-block">
            <span>Risk Level</span>
            <strong className={`risk-text risk-${riskLevel.toLowerCase()}`}>
              {riskLevel}
            </strong>
          </div>

          <div className="status-block">
            <span>Risk Score</span>
            <strong>{episode?.risk_score ?? "--"}/100</strong>
          </div>

          <div className="status-block">
            <span>Containment</span>
            <strong>{containment}</strong>
          </div>

          <div className="status-block">
            <span>Audit Actions</span>
            <strong>{auditData?.count || 0}</strong>
          </div>
        </aside>
      </section>

      <section className="content-grid two-column">
        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Affected Asset</p>
            <h3>What system is involved?</h3>
          </div>

          <div className="info-list">
            <InfoRow
              label="Pod"
              value={episode?.pod}
              helper="A Pod is the smallest Kubernetes unit running an application container."
            />
            <InfoRow
              label="Namespace"
              value={episode?.namespace}
              helper="A Namespace groups Kubernetes resources into a logical environment."
            />
            <InfoRow
              label="Service"
              value={episode?.service}
              helper="The application service affected by the suspicious package behavior."
            />
            <InfoRow
              label="Image"
              value={episode?.image}
              helper="The container image running inside the affected Pod."
            />
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Suspicious Package</p>
            <h3>What triggered the case?</h3>
          </div>

          <div className="package-card">
            <span className="package-name">{episode?.package || "unknown"}</span>
            <p>
              A package is an external dependency or library used by the
              application. In this case, Splunk evidence shows suspicious
              runtime behavior connected to this package.
            </p>
          </div>

          <div className="signal-list">
            {(episode?.risk_signals || []).map((signal) => (
              <SignalPill key={signal} signal={signal} />
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid two-column">
        <article className="panel ai-panel">
          <div className="section-heading">
            <p className="eyebrow">AI Explanation</p>
            <h3>Why this case matters</h3>
          </div>

          <div className="explanation-block">
            <h4>Reasoning</h4>
            <p>
              {aiExplanation?.why_it_matters ||
                "CivicShield correlated multiple suspicious events from Splunk logs."}
            </p>
          </div>

          <div className="explanation-block">
            <h4>Recommended Response</h4>
            <p>
              {aiExplanation?.recommended_response ||
                "Review the evidence timeline and run containment actions if needed."}
            </p>
          </div>

          <div className="confidence-row">
            <span>Confidence</span>
            <strong>{aiExplanation?.confidence || "Medium"}</strong>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Splunk Source</p>
            <h3>Where the evidence came from</h3>
          </div>

          <div className="source-card">
            <InfoRow
              label="Source"
              value={source}
              helper="Splunk is used as the evidence source and search layer."
            />
            <InfoRow
              label="Index"
              value={index}
              helper="The index storing supply chain security telemetry."
            />
            <InfoRow
              label="Events Analyzed"
              value={eventCount}
              helper="Events correlated into this incident case."
            />
          </div>

          <div className="small-note">
            Demo data is synthetic, but the pipeline is real: the backend reads
            the Splunk index, builds an incident case, and connects the result
            to Kubernetes containment actions.
          </div>
        </article>
      </section>
    </div>
  );
}

export default CaseOverviewPage;