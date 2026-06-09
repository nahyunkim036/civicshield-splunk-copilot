import { useEffect, useState } from "react";

function TimelineCard({ stage, active, onClick }) {
  return (
    <button
      type="button"
      className={`timeline-card ${active ? "active" : ""} severity-${
        stage.severity || "medium"
      }`}
      onClick={onClick}
    >
      <span>{String(stage.step).padStart(2, "0")}</span>
      <strong>{stage.stage}</strong>
      <small>{stage.headline}</small>
    </button>
  );
}

function EvidenceTimelinePage({ evidenceTimeline, onOpenDrawer }) {
  const stages = evidenceTimeline?.stages || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  const activeStage = stages[activeIndex];

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
        <p className="eyebrow">Evidence Timeline</p>
        <h1>No Splunk evidence loaded</h1>
        <p>The backend did not return timeline stages.</p>
      </section>
    );
  }

  function openStage(stage, index) {
    setActiveIndex(index);
    setPlaying(false);
    onOpenDrawer({
      type: "Splunk evidence",
      title: stage.stage,
      subtitle: stage.headline,
      data: stage,
    });
  }

  return (
    <div className="timeline-page">
      <section className="hero-panel compact">
        <div className="hero-copy">
          <p className="eyebrow">Evidence Timeline</p>
          <h1>Replay the log movement</h1>
          <p>
            Each card is one Splunk event transformed into an evidence stage.
          </p>
        </div>

        <div className="timeline-controls">
          <button
            type="button"
            onClick={() => {
              setActiveIndex(0);
              setPlaying(true);
            }}
          >
            Replay
          </button>
          <button type="button" onClick={() => setPlaying((value) => !value)}>
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setActiveIndex((current) => Math.min(current + 1, stages.length - 1));
            }}
          >
            Next
          </button>
        </div>
      </section>

      <section className="timeline-board">
        <div className="current-stage">
          <span>
            Stage {activeIndex + 1} / {stages.length}
          </span>
          <h2>{activeStage?.stage}</h2>
          <p>{activeStage?.headline}</p>
        </div>

        <div className="progress">
          <div style={{ width: `${((activeIndex + 1) / stages.length) * 100}%` }} />
        </div>

        <div className="timeline-grid">
          {stages.map((stage, index) => (
            <TimelineCard
              key={stage.id}
              stage={stage}
              active={index === activeIndex}
              onClick={() => openStage(stage, index)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default EvidenceTimelinePage;