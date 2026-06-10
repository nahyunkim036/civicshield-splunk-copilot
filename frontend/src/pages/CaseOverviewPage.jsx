import { useMemo, useState } from "react";

function SummaryItem({ icon, label, value, tone, onClick }) {
  return (
    <button
      type="button"
      className={`summary-item ${tone || ""}`}
      onClick={onClick}
    >
      <span className="summary-icon">{icon}</span>
      <span className="summary-copy">
        <small>{label}</small>
        <strong>{value || "unknown"}</strong>
      </span>
    </button>
  );
}

function FlowStep({ icon, title, subtitle, active, onClick }) {
  return (
    <button
      type="button"
      className={`compact-flow-step ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
    </button>
  );
}

function StagePreview({ stage, onClick }) {
  return (
    <button
      type="button"
      className={`stage-preview severity-${stage.severity || "medium"}`}
      onClick={onClick}
    >
      <span>{String(stage.step).padStart(2, "0")}</span>
      <div>
        <strong>{stage.stage}</strong>
        <small>{stage.headline}</small>
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

          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="pop-body">{modal.content}</div>
      </section>
    </div>
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
  const visibleStages = stages.slice(0, 5);
  const eventCount = episodeData?.total_events_analyzed || episode?.event_count || 0;
  const sourceIndex = episodeData?.index || "civic_supply_chain_logs";

  const modals = useMemo(
    () => ({
      logs: {
        eyebrow: "📜 Splunk Logs",
        title: "What Splunk analyzed",
        tone: "blue",
        content: (
          <>
            <p className="modal-copy">
              Splunk is the evidence source. The backend queries the indexed
              supply-chain events and converts them into a case, timeline, and
              response playbook.
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

      signals: {
        eyebrow: "🧪 Splunk Analysis",
        title: "How the evidence was grouped",
        tone: "yellow",
        content: (
          <>
            <p className="modal-copy">
              CivicShield groups Splunk events into security signals such as
              package entry, credential access, external connection, privilege
              escalation, and containment.
            </p>

            <div className="signal-cloud">
              {(episode?.risk_signals || []).map((signal) => (
                <SignalPill key={signal} signal={signal} />
              ))}
            </div>

            <div className="modal-grid">
              <ModalRow label="Risk level" value={episode?.risk_level} />
              <ModalRow label="Risk score" value={`${episode?.risk_score ?? "--"}/100`} />
              <ModalRow label="Pod" value={episode?.pod} />
              <ModalRow label="Package" value={episode?.package} />
            </div>
          </>
        ),
      },

      ai: {
        eyebrow: "🧠 AI Summary",
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
              <ModalRow
                label="Confidence"
                value={aiExplanation?.confidence || "Medium"}
              />
              <ModalRow label="Containment" value={episode?.containment} />
            </div>
          </>
        ),
      },

      response: {
        eyebrow: "🛡️ Response",
        title: "What the user can do next",
        tone: "red",
        content: (
          <>
            <p className="modal-copy">
              After reviewing the evidence, the user can run containment
              actions. In Kubernetes mode, CivicShield can quarantine the
              affected Pod and apply a deny-egress NetworkPolicy.
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
    <div className="case-page compact-page">
      <section className="page-title-row">
        <div>
          <p className="eyebrow">🔎 Case Overview</p>
          <h1>{episode?.episode_title || "Supply Chain Incident Case"}</h1>
          <p>
            Splunk analyzed {eventCount || "the"} events and grouped them into
            one incident. Click a section to inspect details only when needed.
          </p>
        </div>

        <div className="page-actions">
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
            Run Response
          </button>
        </div>
      </section>

      <section className="compact-workbench">
        <article className="case-main-card">
          <div className="case-main-header">
            <div>
              <p className="eyebrow">Incident</p>
              <h2>Analyzed supply-chain behavior</h2>
            </div>

            <span className={`risk-badge ${String(episode?.risk_level || "").toLowerCase()}`}>
              {episode?.risk_level || "Unknown"}
            </span>
          </div>

          <div className="case-identity">
            <div>
              <span>Pod</span>
              <strong>{episode?.pod || "unknown"}</strong>
            </div>
            <div>
              <span>Namespace</span>
              <strong>{episode?.namespace || "unknown"}</strong>
            </div>
            <div>
              <span>Package</span>
              <strong>{episode?.package || "unknown"}</strong>
            </div>
          </div>

          <div className="compact-flow">
            <FlowStep
              icon="📜"
              title="Logs"
              subtitle="Indexed in Splunk"
              active
              onClick={() => setModalKey("logs")}
            />
            <FlowStep
              icon="🧪"
              title="Analysis"
              subtitle="Signals separated"
              active
              onClick={() => setModalKey("signals")}
            />
            <FlowStep
              icon="🧠"
              title="AI Summary"
              subtitle="Readable explanation"
              active
              onClick={() => setModalKey("ai")}
            />
            <FlowStep
              icon="🛡️"
              title="Response"
              subtitle="Kubernetes actions"
              onClick={() => setModalKey("response")}
            />
          </div>
        </article>

        <aside className="case-side-summary">
          <SummaryItem
            icon="🚨"
            label="Risk"
            value={episode?.risk_level}
            tone="red"
            onClick={() => setModalKey("signals")}
          />
          <SummaryItem
            icon="☸️"
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
          <SummaryItem
            icon="📦"
            label="Package"
            value={episode?.package}
            tone="yellow"
            onClick={() => setModalKey("signals")}
          />
          <SummaryItem
            icon="📊"
            label="Events"
            value={eventCount}
            tone="green"
            onClick={() => setModalKey("logs")}
          />
        </aside>
      </section>

      <section className="evidence-preview-section">
        <div className="section-mini-head">
          <div>
            <p className="eyebrow">🧩 Evidence Preview</p>
            <h2>What the logs are saying</h2>
          </div>

          <button type="button" onClick={() => onTabChange("timeline")}>
            Open full timeline
          </button>
        </div>

        <div className="evidence-preview-list">
          {visibleStages.map((stage) => (
            <StagePreview
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
      </section>

      <PopModal modal={modals[modalKey]} onClose={() => setModalKey(null)} />
    </div>
  );
}

export default CaseOverviewPage;