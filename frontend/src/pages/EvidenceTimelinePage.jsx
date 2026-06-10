import { useEffect, useState } from "react";

function getStageMeaning(stage) {
  if (stage?.meaning) return stage.meaning;
  if (stage?.description) return stage.description;
  return "This Splunk event is part of the detection evidence.";
}

function getStageOperatorNote(stage) {
  if (stage?.operator_note) return stage.operator_note;
  return "Review the raw Splunk event fields before running response actions.";
}

function TimelineRow({ stage, active, isLast, onClick }) {
  return (
    <button
      type="button"
      className={`timeline-row ${active ? "active" : ""} severity-${
        stage.severity || "medium"
      }`}
      onClick={onClick}
    >
      <div className="timeline-row-marker">
        <span>{String(stage.step).padStart(2, "0")}</span>
        {!isLast && <i />}
      </div>

      <div className="timeline-row-main">
        <div className="timeline-row-top">
          <strong>{stage.stage}</strong>
          <small>{stage.time}</small>
        </div>

        <p>{stage.headline}</p>

        <div className="timeline-row-meta">
          <span>{stage.event_type}</span>
          <span>{stage.severity}</span>
        </div>
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

  function selectStage(index) {
    setActiveIndex(index);
    setPlaying(false);
  }

  function openRawDetail() {
    if (!activeStage) return;

    onOpenDrawer({
      type: "Raw Splunk evidence",
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
          <h1>Detection path</h1>
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

      <section className="timeline-workbench flow-layout">
        <article className="timeline-list-panel flow-list-panel">
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

          <div className="timeline-flow-list">
            {stages.map((stage, index) => (
              <TimelineRow
                key={stage.id}
                stage={stage}
                active={index === activeIndex}
                isLast={index === stages.length - 1}
                onClick={() => selectStage(index)}
              />
            ))}
          </div>
        </article>

        <aside className="timeline-detail-panel flow-detail-panel">
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
            view raw Splunk event
          </button>
        </aside>
      </section>
    </div>
  );
}

export default EvidenceTimelinePage;