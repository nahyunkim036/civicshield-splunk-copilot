import { useEffect, useState } from "react";

function getStageMeaning(stage) {
  const signal = stage?.risk_signal || stage?.event_type;

  const meanings = {
    supply_chain_entry:
      "A suspicious package appeared inside the application runtime.",
    unexpected_execution:
      "The package behavior moved from loading to actual process execution.",
    credential_access:
      "The workload accessed a Kubernetes service account token path.",
    external_c2_connection:
      "The pod attempted outbound communication to an unapproved destination.",
    privilege_escalation:
      "The container attempted to increase its privileges.",
    containment:
      "The suspicious pod was marked for quarantine.",
    egress_block:
      "Outbound traffic was blocked using a Kubernetes NetworkPolicy.",
    audit_record:
      "The response action was recorded for review.",
  };

  return meanings[signal] || stage?.description || "Splunk evidence stage.";
}

function getStageOperatorNote(stage) {
  const signal = stage?.risk_signal || stage?.event_type;

  const notes = {
    supply_chain_entry: "Check dependency source and runtime image.",
    unexpected_execution: "Review process behavior inside the container.",
    credential_access: "Treat exposed service account token as compromised.",
    external_c2_connection: "Block outbound traffic before further exfiltration.",
    privilege_escalation: "Keep the workload isolated and review permissions.",
    containment: "Confirm quarantine label was applied to the pod.",
    egress_block: "Confirm deny-egress policy exists in the namespace.",
    audit_record: "Use the audit record as response evidence.",
  };

  return notes[signal] || "Review the raw event fields.";
}

function TimelineCard({ stage, active, onClick }) {
  return (
    <button
      type="button"
      className={`timeline-card compact ${active ? "active" : ""} severity-${
        stage.severity || "medium"
      }`}
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

function DetailField({ label, value }) {
  return (
    <div className="timeline-detail-field">
      <span>{label}</span>
      <strong>{value || "--"}</strong>
    </div>
  );
}

function EvidenceTimelinePage({ evidenceTimeline, onOpenDrawer }) {
  const stages = evidenceTimeline?.stages || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  const activeStage = stages[activeIndex];
  const evidence = activeStage?.evidence || {};

  useEffect(() => {
    if (!playing || stages.length === 0) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= stages.length - 1) return 0;
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [playing, stages.length]);

  if (!stages.length) {
    return (
      <section className="empty-panel">
        <p className="eyebrow">🧩 Evidence</p>
        <h1>No evidence loaded</h1>
      </section>
    );
  }

  function selectStage(stage, index) {
    setActiveIndex(index);
    setPlaying(false);
  }

  function openRawDetail() {
    if (!activeStage) return;

    onOpenDrawer({
      type: "Splunk evidence",
      title: activeStage.stage,
      subtitle: activeStage.headline,
      data: activeStage,
    });
  }

  return (
    <div className="timeline-page compact-timeline">
      <section className="timeline-mini-header">
        <div>
          <p className="eyebrow">🧩 Evidence</p>
          <h1>Log movement</h1>
        </div>

        <div className="mini-controls">
          <button
            type="button"
            onClick={() => {
              setActiveIndex(0);
              setPlaying(true);
            }}
          >
            replay
          </button>
          <button type="button" onClick={() => setPlaying((value) => !value)}>
            {playing ? "pause" : "play"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setActiveIndex((current) =>
                Math.min(current + 1, stages.length - 1)
              );
            }}
          >
            next
          </button>
        </div>
      </section>

      <section className="timeline-workbench">
        <article className="timeline-list-panel">
          <div className="timeline-progress-mini">
            <span>
              {activeIndex + 1}/{stages.length}
            </span>
            <div>
              <i
                style={{
                  width: `${((activeIndex + 1) / stages.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="timeline-list">
            {stages.map((stage, index) => (
              <TimelineCard
                key={stage.id}
                stage={stage}
                active={index === activeIndex}
                onClick={() => selectStage(stage, index)}
              />
            ))}
          </div>
        </article>

        <aside className="timeline-detail-panel">
          <div className="timeline-detail-top">
            <div>
              <span className="stage-count">
                stage {activeIndex + 1} / {stages.length}
              </span>
              <h2>{activeStage?.stage}</h2>
              <p>{activeStage?.headline}</p>
            </div>

            <span className={`severity-dot ${activeStage?.severity || "medium"}`}>
              {activeStage?.severity || "medium"}
            </span>
          </div>

          <div className="timeline-meaning-card">
            <span>Meaning</span>
            <p>{getStageMeaning(activeStage)}</p>
          </div>

          <div className="timeline-meaning-card soft">
            <span>Operator note</span>
            <p>{getStageOperatorNote(activeStage)}</p>
          </div>

          <div className="timeline-detail-grid">
            <DetailField label="Event type" value={activeStage?.event_type} />
            <DetailField label="Risk signal" value={activeStage?.risk_signal} />
            <DetailField label="Time" value={evidence.timestamp || activeStage?.time} />
            <DetailField label="Status" value={activeStage?.status} />
            <DetailField label="Process" value={evidence.process} />
            <DetailField label="Destination IP" value={evidence.dest_ip} />
          </div>

          {evidence.file_path && (
            <div className="timeline-code-snippet">
              <span>File path</span>
              <code>{evidence.file_path}</code>
            </div>
          )}

          <button type="button" className="text-action" onClick={openRawDetail}>
            view raw event
          </button>
        </aside>
      </section>
    </div>
  );
}

export default EvidenceTimelinePage;