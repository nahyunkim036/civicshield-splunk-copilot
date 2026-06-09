import { useState } from "react";

function SummaryMetric({ label, value, helper, tone, onClick }) {
  return (
    <button
      type="button"
      className={`summary-metric ${tone || ""}`}
      onClick={onClick}
    >
      <span>{label}</span>
      <strong>{value || "unknown"}</strong>
      {helper && <small>{helper}</small>}
    </button>
  );
}

function DetailPanel({ activeDetail, onClose }) {
  if (!activeDetail) {
    return (
      <aside className="overview-detail-panel empty">
        <p className="eyebrow">Details</p>
        <h3>Select a case card</h3>
        <p>
          Click Risk, Pod, Package, Containment, AI Summary, or Splunk Source to
          inspect the details behind this case.
        </p>
      </aside>
    );
  }

  return (
    <aside className="overview-detail-panel active">
      <div className="detail-panel-header">
        <div>
          <p className="eyebrow">{activeDetail.eyebrow}</p>
          <h3>{activeDetail.title}</h3>
        </div>

        <button type="button" onClick={onClose} aria-label="Close detail panel">
          ×
        </button>
      </div>

      <div className="detail-panel-body">{activeDetail.content}</div>
    </aside>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="mini-detail-row">
      <span>{label}</span>
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
  const [activeDetail, setActiveDetail] = useState(null);

  const source = episodeData?.source || "splunk";
  const index = episodeData?.index || "civic_supply_chain_logs";
  const eventCount =
    episodeData?.total_events_analyzed || episode?.event_count || 0;

  const riskLevel = episode?.risk_level || "Unknown";
  const containment = episode?.containment || "Unknown";

  const details = {
    risk: {
      eyebrow: "Risk",
      title: "Why this case is risky",
      content: (
        <>
          <p className="detail-copy">
            {aiExplanation?.why_it_matters ||
              "CivicShield correlated multiple suspicious runtime events from Splunk logs."}
          </p>

          <div className="risk-signal-group">
            {(episode?.risk_signals || []).map((signal) => (
              <SignalPill key={signal} signal={signal} />
            ))}
          </div>

          <div className="mini-detail-grid">
            <DetailRow label="Risk Level" value={riskLevel} />
            <DetailRow label="Risk Score" value={`${episode?.risk_score ?? "--"}/100`} />
            <DetailRow label="Confidence" value={aiExplanation?.confidence || "Medium"} />
          </div>
        </>
      ),
    },

    pod: {
      eyebrow: "Affected Asset",
      title: "Kubernetes Pod details",
      content: (
        <>
          <p className="detail-copy">
            A Pod is the smallest Kubernetes unit running an application
            container. This is the workload affected by the suspicious package.
          </p>

          <div className="mini-detail-grid">
            <DetailRow label="Pod" value={episode?.pod} />
            <DetailRow label="Namespace" value={episode?.namespace} />
            <DetailRow label="Service" value={episode?.service} />
            <DetailRow label="Image" value={episode?.image} />
          </div>
        </>
      ),
    },

    package: {
      eyebrow: "Suspicious Package",
      title: episode?.package || "Unknown package",
      content: (
        <>
          <p className="detail-copy">
            A package is an external dependency or library used by the
            application. In this case, Splunk evidence shows suspicious runtime
            behavior connected to this dependency.
          </p>

          <div className="mini-detail-grid">
            <DetailRow label="Package" value={episode?.package} />
            <DetailRow label="Service" value={episode?.service} />
            <DetailRow label="Environment" value={episode?.environment} />
          </div>
        </>
      ),
    },

    containment: {
      eyebrow: "Containment",
      title: "Current response status",
      content: (
        <>
          <p className="detail-copy">
            Containment means limiting the suspicious workload so it cannot keep
            communicating outward or spreading. CivicShield uses Kubernetes
            quarantine labeling and deny-egress NetworkPolicy for this prototype.
          </p>

          <div className="mini-detail-grid">
            <DetailRow label="Status" value={containment} />
            <DetailRow label="Audit Actions" value={auditData?.count || 0} />
            <DetailRow label="Primary Action 1" value="Quarantine Pod" />
            <DetailRow label="Primary Action 2" value="Apply NetworkPolicy" />
          </div>

          <button
            className="panel-action-button"
            type="button"
            onClick={() => onTabChange("containment")}
          >
            Open Containment
          </button>
        </>
      ),
    },

    ai: {
      eyebrow: "AI Explanation",
      title: "Case summary generated from Splunk evidence",
      content: (
        <>
          <p className="detail-copy">
            {aiExplanation?.case_summary ||
              "CivicShield analyzed Splunk evidence and built an incident case."}
          </p>

          <p className="detail-copy">
            {aiExplanation?.recommended_response ||
              "Review the evidence timeline and run containment actions if needed."}
          </p>

          <div className="mini-detail-grid">
            <DetailRow label="Confidence" value={aiExplanation?.confidence || "Medium"} />
            <DetailRow label="Source" value="CivicShield AI explanation layer" />
          </div>
        </>
      ),
    },

    splunk: {
      eyebrow: "Splunk Source",
      title: "Evidence source",
      content: (
        <>
          <p className="detail-copy">
            The demo data is synthetic, but the pipeline is real: events are
            indexed in Splunk, queried by the backend, converted into an
            incident case, and connected to Kubernetes containment actions.
          </p>

          <div className="mini-detail-grid">
            <DetailRow label="Source" value={source} />
            <DetailRow label="Index" value={index} />
            <DetailRow label="Events Analyzed" value={eventCount} />
          </div>
        </>
      ),
    },
  };

  return (
    <div className="overview-screen">
      <section className="overview-main-card">
        <div className="overview-case-copy">
          <p className="eyebrow">Case Overview</p>
          <h2>{episode?.episode_title || "Supply Chain Incident Case"}</h2>
          <p>
            Splunk evidence was correlated into one incident case. Start with the
            timeline to understand what happened, then run containment actions.
          </p>

          <div className="overview-actions">
            <button
              className="primary-action"
              type="button"
              onClick={() => onTabChange("timeline")}
            >
              View Evidence
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={() => onTabChange("containment")}
            >
              Run Containment
            </button>
          </div>
        </div>

        <div className="overview-side-rail">
          <button type="button" onClick={() => setActiveDetail(details.ai)}>
            AI Summary
          </button>
          <button type="button" onClick={() => setActiveDetail(details.splunk)}>
            Splunk Source
          </button>
          <button type="button" onClick={() => setActiveDetail(details.risk)}>
            Risk Signals
          </button>
        </div>
      </section>

      <section className="overview-metric-grid">
        <SummaryMetric
          label="Risk"
          value={riskLevel}
          helper={`${episode?.risk_score ?? "--"}/100`}
          tone={`risk-${riskLevel.toLowerCase()}`}
          onClick={() => setActiveDetail(details.risk)}
        />
        <SummaryMetric
          label="Affected Pod"
          value={episode?.pod}
          helper={episode?.namespace}
          onClick={() => setActiveDetail(details.pod)}
        />
        <SummaryMetric
          label="Package"
          value={episode?.package}
          helper="Suspicious dependency"
          tone="warning"
          onClick={() => setActiveDetail(details.package)}
        />
        <SummaryMetric
          label="Containment"
          value={containment}
          helper={`${auditData?.count || 0} audit actions`}
          tone="contained"
          onClick={() => setActiveDetail(details.containment)}
        />
      </section>

      <section className="overview-detail-layout">
        <div className="overview-mini-flow">
          <div className="mini-flow-item">
            <span>01</span>
            <strong>Splunk Evidence</strong>
          </div>
          <div className="mini-flow-line" />
          <div className="mini-flow-item">
            <span>02</span>
            <strong>Incident Case</strong>
          </div>
          <div className="mini-flow-line" />
          <div className="mini-flow-item">
            <span>03</span>
            <strong>Kubernetes Containment</strong>
          </div>
        </div>

        <DetailPanel
          activeDetail={activeDetail}
          onClose={() => setActiveDetail(null)}
        />
      </section>
    </div>
  );
}

export default CaseOverviewPage;