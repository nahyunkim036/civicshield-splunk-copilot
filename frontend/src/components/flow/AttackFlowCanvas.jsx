import { useEffect, useMemo, useState } from "react";

function EvidenceStage({ stage, isActive, isCompleted, onClick }) {
  return (
    <button
      type="button"
      className={`timeline-stage ${isActive ? "active" : ""} ${
        isCompleted ? "completed" : ""
      } severity-${stage.severity || "medium"}`}
      onClick={onClick}
    >
      <span className="stage-step">{String(stage.step).padStart(2, "0")}</span>

      <span className="stage-body">
        <span className="stage-time">{stage.time || "--"}</span>
        <strong>{stage.stage}</strong>
        <small>{stage.headline}</small>
      </span>

      <span className="stage-status">{stage.severity}</span>
    </button>
  );
}

function EvidenceDetail({ stage }) {
  if (!stage) {
    return (
      <aside className="evidence-detail empty">
        <p className="eyebrow">Evidence Detail</p>
        <h3>Select a timeline stage</h3>
        <p>
          Click any stage in the timeline to inspect the Splunk evidence,
          affected asset, and why this event matters.
        </p>
      </aside>
    );
  }

  const evidence = stage.evidence || {};

  return (
    <aside className="evidence-detail">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Selected Evidence</p>
          <h3>{stage.stage}</h3>
        </div>
        <span className={`detail-severity severity-${stage.severity}`}>
          {stage.severity}
        </span>
      </div>

      <p className="detail-headline">{stage.headline}</p>

      <div className="detail-section">
        <h4>Why it matters</h4>
        <p>{stage.explanation || stage.description}</p>
      </div>

      <div className="evidence-grid">
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
        <div>
          <span>Action</span>
          <strong>{evidence.action || "--"}</strong>
        </div>
      </div>

      {evidence.file_path && (
        <div className="code-evidence">
          <span>File Path</span>
          <code>{evidence.file_path}</code>
        </div>
      )}

      {evidence.raw_description && (
        <div className="detail-section">
          <h4>Raw Splunk Description</h4>
          <p>{evidence.raw_description}</p>
        </div>
      )}
    </aside>
  );
}

function AttackFlowPage({ episode, evidenceTimeline, onEvidenceSelect }) {
  const stages = useMemo(
    () => evidenceTimeline?.stages || [],
    [evidenceTimeline]
  );

  const [activeIndex, setActiveIndex] = useState(0);
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
    }, 2200);

    return () => window.clearInterval(timer);
  }, [isPlaying, stages.length]);

  function handleStageClick(stage, index) {
    setActiveIndex(index);
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
    setIsPlaying(true);
  }

  function handleNext() {
    setIsPlaying(false);
    setActiveIndex((current) => Math.min(current + 1, stages.length - 1));
  }

  if (!stages.length) {
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Evidence Timeline</p>
          <h2>No evidence timeline available.</h2>
          <p>
            CivicShield could not find timeline stages from the current Splunk
            response.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="timeline-hero">
        <div>
          <p className="eyebrow">Evidence Timeline</p>
          <h2>{evidenceTimeline?.title || "Splunk Evidence Replay"}</h2>
          <p>
            CivicShield reconstructs the incident from Splunk events so the
            operator can see how the suspicious package moved from runtime
            activity to containment.
          </p>
        </div>

        <div className="timeline-controls">
          <button type="button" onClick={handleReplay}>
            Replay
          </button>
          <button type="button" onClick={() => setIsPlaying((value) => !value)}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={handleNext}>
            Next Stage
          </button>
        </div>
      </section>

      <section className="timeline-layout">
        <article className="timeline-panel">
          <div className="timeline-progress">
            <span>
              Stage {activeIndex + 1} of {stages.length}
            </span>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${((activeIndex + 1) / stages.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="timeline-list">
            {stages.map((stage, index) => (
              <EvidenceStage
                key={stage.id}
                stage={stage}
                isActive={index === activeIndex}
                isCompleted={index < activeIndex}
                onClick={() => handleStageClick(stage, index)}
              />
            ))}
          </div>
        </article>

        <EvidenceDetail stage={activeStage} />
      </section>

      <section className="panel compact-panel">
        <p className="eyebrow">What this timeline shows</p>
        <h3>{episode?.episode_title || "Incident Evidence"}</h3>
        <p>
          This is not a generated animation. It is a time-ordered replay of
          Splunk events from the <strong>civic_supply_chain_logs</strong> index.
          Each stage is derived from an actual event field such as event_type,
          severity, process, destination IP, and file path.
        </p>
      </section>
    </div>
  );
}

export default AttackFlowPage;