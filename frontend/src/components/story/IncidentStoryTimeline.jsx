import { useMemo, useState } from "react";

function IncidentStoryTimeline({ timeline = [] }) {
  const [selectedStep, setSelectedStep] = useState(timeline[0]?.step || 1);

  const selectedStage = useMemo(() => {
    return timeline.find((item) => item.step === selectedStep) || timeline[0];
  }, [timeline, selectedStep]);

  if (!timeline.length) {
    return (
      <section className="story-stage-board">
        <p className="section-label">Incident Storyline</p>
        <h2>No timeline available</h2>
      </section>
    );
  }

  return (
    <section className="story-stage-board">
      <div className="story-stage-header">
        <div>
          <p className="section-label">Incident Path</p>
          <h2>Attack sequence</h2>
        </div>

        <span className="soft-pill">{timeline.length} stages</span>
      </div>

      <div className="stage-rail">
        {timeline.map((item, index) => (
          <button
            key={`${item.step}-${item.stage}`}
            className={
              selectedStage.step === item.step
                ? `stage-dot active story-${item.severity}`
                : `stage-dot story-${item.severity}`
            }
            onClick={() => setSelectedStep(item.step)}
          >
            <span>{String(item.step).padStart(2, "0")}</span>
            <strong>{item.stage}</strong>
            {index < timeline.length - 1 && <div className="stage-line" />}
          </button>
        ))}
      </div>

      <div className={`selected-stage-card story-${selectedStage.severity}`}>
        <div className="selected-stage-meta">
          <span>{selectedStage.time}</span>
          <span>{selectedStage.severity}</span>
        </div>

        <h3>{selectedStage.headline}</h3>
        <p>{selectedStage.narration}</p>

        <div className="evidence-strip">
          <span>Evidence</span>
          <strong>{selectedStage.evidence_hint}</strong>
        </div>
      </div>
    </section>
  );
}

export default IncidentStoryTimeline;