import { useMemo, useState } from "react";

function InfoCard({ label, value, tone, onClick }) {
  return (
    <button
      type="button"
      className={`info-card ${tone || ""}`}
      onClick={onClick}
    >
      <span>{label}</span>
      <strong>{value || "unknown"}</strong>
    </button>
  );
}

function FlowButton({ number, title, subtitle, active, onClick }) {
  return (
    <button
      type="button"
      className={`flow-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span>{number}</span>
      <div>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
    </button>
  );
}

function ModalRow({ label, value }) {
  return (
    <div className="modal-row">
      <span>{label}</span>
      <strong>{value || "--"}</strong>
    </div>
  );
}

function SignalPill({ signal }) {
  return <span className="signal-pill">{signal}</span>;
}

function PopModal({ modal, onClose }) {
  if (!modal) return null;

  return (
    <div className="pop-backdrop" onClick={onClose}>
      <section
        className={`pop-card ${modal.tone || ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pop-header">
          <div>
            <p className="eyebrow">{modal.eyebrow}</p>
            <h2>{modal.title}</h2>
          </div>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="pop-body">{modal.content}</div>
      </section>
    </div>
  );
}

function StageMini({ stage, onClick }) {
  return (
    <button
      type="button"
      className={`stage-mini severity-${stage.severity || "medium"}`}
      onClick={onClick}
    >
      <span>{String(stage.step).padStart(2, "0")}</span>
      <strong>{stage.stage}</strong>
      <small>{stage.headline}</small>
    </button>
  );
}

function CaseOverviewPage({
  episodeData,
  episode,
  aiExplanation,
  auditData,
  evidenceTimeline,
  onTabChange,
  onOpenDrawer,
}) {
  const [modalKey, setModalKey] = useState(null);

  const stages = evidenceTimeline?.stages || [];
  const visibleStages = stages.slice(0, 6);
  const eventCount = episodeData?.total_events_analyzed || episode?.event_count || 0;
  const sourceIndex = episodeData?.index || "civic_supply_chain_logs";

  const modals = useMemo(
    () => ({
      logs: {
        eyebrow: "Splunk Source",
        title: "What Splunk analyzed",
        tone: "blue",
        content: (
          <>
            <p className="modal-copy">
              Splunk stores the supply-chain security events. The backend asks
              Splunk for the indexed events, then separates them into risk
              signals and timeline stages.
            </p>

            <div className="modal-grid">
              <ModalRow label="Index" value={sourceIndex} />
              <ModalRow label="Events analyzed" value={eventCount} />
              <ModalRow label="Source" value={episodeData?.source || "splunk"} />
              <ModalRow label="Case" value={episode?.episode_title} />
            </div>
          </>
        ),
      },

      ai: {
        eyebrow: "AI Summary",
        title: "Readable case explanation",
        tone: "green",
        content: (
          <>
            <p className="modal-copy large">
              {aiExplanation?.case_summary ||
                "CivicShield analyzed Splunk evidence and built an incident case."}
            </p>

            <div className="modal-note">
              {aiExplanation?.why_it_matters ||
                "Multiple suspicious runtime events were correlated from Splunk logs."}
            </div>

            <p className="modal-copy">
              {aiExplanation?.recommended_response ||
                "Review the evidence timeline and run containment actions if needed."}
            </p>

            <div className="modal-grid">
              <ModalRow label="Confidence" value={aiExplanation?.confidence || "Medium"} />
              <ModalRow label="Risk level" value={episode?.risk_level} />
            </div>
          </>
        ),
      },

      signals: {
        eyebrow: "Splunk Analysis",
        title: "How the evidence was separated",
        tone: "yellow",
        content: (
          <>
            <p className="modal-copy">
              The case is built by grouping Splunk events into meaningful
              security signals.
            </p>

            <div className="signal-cloud">
              {(episode?.risk_signals || []).map((signal) => (
                <SignalPill key={signal} signal={signal} />
              ))}
            </div>

            <div className="modal-grid">
              <ModalRow label="Risk score" value={`${episode?.risk_score ?? "--"}/100`} />
              <ModalRow label="Containment" value={episode?.containment} />
            </div>
          </>
        ),
      },

      response: {
        eyebrow: "Response",
        title: "What the user can do next",
        tone: "red",
        content: (
          <>
            <p className="modal-copy">
              After understanding the evidence, the user can run response actions.
              In Kubernetes mode, the app can quarantine the affected pod and
              apply a deny-egress NetworkPolicy.
            </p>

            <div className="modal-grid">
              <ModalRow label="Target pod" value={episode?.pod} />
              <ModalRow label="Namespace" value={episode?.namespace} />
              <ModalRow label="Audit actions" value={auditData?.count || 0} />
              <ModalRow label="Status" value={episode?.containment} />
            </div>

            <button
              type="button"
              className="modal-action"
              onClick={() => onTabChange("containment")}
            >
              Open response workspace
            </button>
          </>
        ),
      },
    }),
    [episodeData, episode, aiExplanation, auditData, eventCount, sourceIndex, onTabChange]
  );

  return (
    <div className="case-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Case Overview</p>
          <h1>{episode?.episode_title || "Supply Chain Incident Case"}</h1>
          <p>
            Splunk analyzes the logs. CivicShield separates the evidence and
            turns it into a readable AI summary and Kubernetes response workflow.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="primary-action"
              onClick={() => onTabChange("timeline")}
            >
              View Evidence
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() => setModalKey("ai")}
            >
              AI Summary
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() => onTabChange("containment")}
            >
              Run Containment
            </button>
          </div>
        </div>

        <div className="flow-panel">
          <FlowButton
            number="01"
            title="Logs"
            subtitle="Indexed in Splunk"
            active
            onClick={() => setModalKey("logs")}
          />
          <FlowButton
            number="02"
            title="Analysis"
            subtitle="Signals separated"
            active
            onClick={() => setModalKey("signals")}
          />
          <FlowButton
            number="03"
            title="AI Summary"
            subtitle="Readable explanation"
            active
            onClick={() => setModalKey("ai")}
          />
          <FlowButton
            number="04"
            title="Response"
            subtitle="Kubernetes actions"
            onClick={() => setModalKey("response")}
          />
        </div>
      </section>

      <section className="info-grid">
        <InfoCard
          label="Risk"
          value={episode?.risk_level}
          tone="red"
          onClick={() => setModalKey("signals")}
        />
        <InfoCard
          label="Pod"
          value={episode?.pod}
          tone="blue"
          onClick={() =>
            onOpenDrawer({
              type: "Affected asset",
              title: episode?.pod,
              subtitle: "Kubernetes pod",
              data: episode,
            })
          }
        />
        <InfoCard
          label="Package"
          value={episode?.package}
          tone="yellow"
          onClick={() => setModalKey("signals")}
        />
        <InfoCard
          label="Events"
          value={eventCount}
          tone="green"
          onClick={() => setModalKey("logs")}
        />
      </section>

      <section className="overview-grid">
        <article className="evidence-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Evidence Movement</p>
              <h2>What the logs are saying</h2>
            </div>

            <button type="button" onClick={() => onTabChange("timeline")}>
              Open full timeline
            </button>
          </div>

          <div className="evidence-surface">
            <div className="surface-grid" />
            <div className="surface-line" />
            <div className="surface-glow glow-a" />
            <div className="surface-glow glow-b" />

            <div className="stage-mini-grid">
              {visibleStages.map((stage) => (
                <StageMini
                  key={stage.id}
                  stage={stage}
                  onClick={() =>
                    onOpenDrawer({
                      type: "Splunk evidence",
                      title: stage.stage,
                      subtitle: stage.headline,
                      data: stage,
                    })
                  }
                />
              ))}
            </div>
          </div>
        </article>

        <article className="side-pocket">
          <p className="eyebrow">AI Summary</p>
          <h2>Open the readable explanation</h2>
          <p>
            Keep the page clean. Click when you want the natural-language case
            explanation.
          </p>
          <button type="button" onClick={() => setModalKey("ai")}>
            Open AI card
          </button>
        </article>

        <article className="side-pocket">
          <p className="eyebrow">Next Step</p>
          <h2>Contain the affected workload</h2>
          <p>{episode?.containment || "Containment Ready"}</p>
          <button type="button" onClick={() => setModalKey("response")}>
            Check response
          </button>
        </article>
      </section>

      <PopModal modal={modals[modalKey]} onClose={() => setModalKey(null)} />
    </div>
  );
}

export default CaseOverviewPage;