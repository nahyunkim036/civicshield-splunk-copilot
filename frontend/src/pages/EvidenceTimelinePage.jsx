import { useEffect, useMemo, useState } from "react";

function TimelineNode({ stage, index, isActive, isCompleted, onClick }) {
  return (
    <button
      type="button"
      className={`timeline-node ${isActive ? "active" : ""} ${
        isCompleted ? "completed" : ""
      } severity-${stage.severity || "medium"}`}
      onClick={onClick}
    >
      <span className="timeline-node-index">{String(index + 1).padStart(2, "0")}</span>
      <strong>{stage.stage}</strong>
      <small>{stage.time || "--"}</small>
    </button>
  );
}

function StageDetailPanel({ stage, onClose }) {
  if (!stage) {
    return (
      <aside className="stage-detail-panel empty">
        <p className="eyebrow">Evidence Detail</p>
        <h3>Select a stage</h3>
        <p>
          Click a timeline stage to inspect the Splunk evidence and why that event
          matters.
        </p>
      </aside>
    );
  }

  const evidence = stage.evidence || {};

  return (
    <aside className="stage-detail-panel active">
      <div className="stage-detail-header">
        <div>
          <p className="eyebrow">Splunk Evidence</p>
          <h3>{stage.stage}</h3>
        </div>

        <button type="button" onClick={onClose} aria-label="Close evidence detail">
          ×
        </button>
      </div>

      <div className="stage-headline-block">
        <span className={`stage-severity-badge severity-${stage.severity}`}>
          {stage.severity}
        </span>
        <strong>{stage.headline}</strong>
      </div>

      <section className="stage-detail-section">
        <h4>Why it matters</h4>
        <p>{stage.explanation || stage.description}</p>
      </section>

      <section className="stage-field-grid">
        <div>
          <span>Timestamp</span>
          <strong>{evidence.timestamp || "--"}</strong>
        </div>
        <div>
          <span>Event Type</span>
          <strong>{stage.event_type || "--"}</strong>
        </div>
        <div>
          <span>Risk Signal</span>
          <strong>{stage.risk_signal || "--"}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{evidence.status || stage.status || "--"}</strong>
        </div>
        <div>
          <span>Pod</span>
          <strong>{evidence.pod || "--"}</strong>
        </div>
        <div>
          <span>Package</span>
          <strong>{evidence.package || "--"}</strong>
        </div>
        <div>
          <span>Process</span>
          <strong>{evidence.process || "--"}</strong>
        </div>
        <div>
          <span>Destination IP</span>
          <strong>{evidence.dest_ip || "--"}</strong>
        </div>
      </section>

      {evidence.file_path && (
        <section className="stage-code-block">
          <span>File Path</span>
          <code>{evidence.file_path}</code>
        </section>
      )}
    </aside>
  );
}

function EvidenceTimelinePage({ episode, evidenceTimeline, onEvidenceSelect }) {
  const stages = useMemo(
    () => evidenceTimeline?.stages || [],
    [evidenceTimeline]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedStage, setSelectedStage] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const activeStage = stages[activeIndex];

  useEffect(() => {
    if (!isPlaying || stages.length === 0) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= stages.length - 1) {
          return 0;
        }

        return current + 1;
      });
    }, 2100);

    return () => window.clearInterval(timer);
  }, [isPlaying, stages.length]);

  useEffect(() => {
    if (!selectedStage && activeStage) {
      setSelectedStage(activeStage);
    }
  }, [activeStage, selectedStage]);

  function handleStageClick(stage, index) {
    setActiveIndex(index);
    setSelectedStage(stage);
    setIsPlaying(false);

    if (onEvidenceSelect) {
      onEvidenceSelect({
        title: stage.stage,
        subtitle: stage.headline,
        type: "Splunk Evidence",
        data: stage,
      });
    }
  }

  function handleReplay() {
    setActiveIndex(0);
    setSelectedStage(stages[0] || null);
    setIsPlaying(true);
  }

  function handleTogglePlay() {
    setIsPlaying((value) => !value);
  }

  function handleNext() {
    setIsPlaying(false);
    setActiveIndex((current) => {
      const nextIndex = Math.min(current + 1, stages.length - 1);
      setSelectedStage(stages[nextIndex]);
      return nextIndex;
    });
  }

  if (!stages.length) {
    return (
      <div className="timeline-screen">
        <section className="timeline-empty-state">
          <p className="eyebrow">Evidence Timeline</p>
          <h2>No evidence timeline available</h2>
          <p>
            CivicShield could not reconstruct timeline stages from the current
            Splunk response.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="timeline-screen">
      <section className="timeline-main-stage">
        <div className="timeline-copy">
          <p className="eyebrow">Evidence Timeline</p>
          <h2>Replay the Splunk evidence sequence</h2>
          <p>
            Each stage is built from Splunk event fields such as event_type,
            severity, file_path, process, and destination IP.
          </p>
        </div>

        <div className="timeline-command-bar">
          <button type="button" onClick={handleReplay}>
            Replay
          </button>
          <button type="button" onClick={handleTogglePlay}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={handleNext}>
            Next
          </button>
        </div>
      </section>

      <section className="timeline-visual-layout">
        <article className="timeline-visual-card">
          <div className="timeline-current-stage">
            <span>
              Stage {activeIndex + 1} / {stages.length}
            </span>
            <strong>{activeStage?.stage}</strong>
            <p>{activeStage?.headline}</p>
          </div>

          <div className="timeline-progress-rail">
            <div
              className="timeline-progress-value"
              style={{
                width: `${((activeIndex + 1) / stages.length) * 100}%`,
              }}
            />
          </div>

          <div className="timeline-node-track">
            {stages.map((stage, index) => (
              <div className="timeline-node-wrap" key={stage.id}>
                <TimelineNode
                  stage={stage}
                  index={index}
                  isActive={index === activeIndex}
                  isCompleted={index < activeIndex}
                  onClick={() => handleStageClick(stage, index)}
                />

                {index < stages.length - 1 && <div className="timeline-connector" />}
              </div>
            ))}
          </div>
        </article>

        <StageDetailPanel
          stage={selectedStage}
          onClose={() => setSelectedStage(null)}
        />
      </section>

      <section className="timeline-footer-note">
        <span>Source</span>
        <strong>Splunk index: civic_supply_chain_logs</strong>
        <p>
          This is a replay of indexed evidence, not a generated animation. The
          visual sequence is reconstructed from the incident events returned by
          the backend.
        </p>
      </section>
    </div>
  );
}

export default EvidenceTimelinePage;