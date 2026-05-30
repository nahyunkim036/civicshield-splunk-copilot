function ResponseCoach({ steps = [] }) {
  if (!steps.length) {
    return (
      <section className="story-panel">
        <p className="section-label">Response Coach</p>
        <h2>No response steps available</h2>
      </section>
    );
  }

  return (
    <section className="story-panel response-coach-panel">
      <div className="panel-heading compact">
        <div>
          <p className="section-label">Response Coach</p>
          <h2>Suggested next steps</h2>
        </div>

        <span className="soft-pill">{steps.length} actions</span>
      </div>

      <div className="response-list">
        {steps.map((step) => (
          <article key={step.priority} className="response-step">
            <div className="response-number">{step.priority}</div>

            <div>
              <h3>{step.action}</h3>
              <p>{step.why}</p>
              <span>{step.owner}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ResponseCoach;