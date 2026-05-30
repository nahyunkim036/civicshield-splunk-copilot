function IncidentStoryTimeline({ timeline = [] }) {
  if (!timeline.length) {
    return (
      <section className="story-panel">
        <p className="section-label">Incident Timeline</p>
        <h2>No story timeline available</h2>
        <p className="story-muted">
          CivicShield could not build a timeline from the available events.
        </p>
      </section>
    );
  }

  return (
    <section className="story-panel story-timeline-panel">
      <div className="panel-heading compact">
        <div>
          <p className="section-label">Incident Storyline</p>
          <h2>How the incident unfolded</h2>
        </div>

        <span className="soft-pill">{timeline.length} stages</span>
      </div>

      <div className="story-timeline">
        {timeline.map((item) => (
          <article
            key={`${item.step}-${item.stage}`}
            className={`story-step story-${item.severity}`}
          >
            <div className="story-step-marker">
              <span>{item.step}</span>
            </div>

            <div className="story-step-content">
              <div className="story-step-meta">
                <span>{item.time}</span>
                <span>{item.severity}</span>
              </div>

              <h3>{item.stage}</h3>
              <strong>{item.headline}</strong>
              <p>{item.narration}</p>

              <div className="story-evidence-hint">
                {item.evidence_hint}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default IncidentStoryTimeline;