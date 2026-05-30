import { useState } from "react";

function ResponseCoach({ steps = [] }) {
  const [selectedPriority, setSelectedPriority] = useState(
    steps[0]?.priority || 1
  );

  if (!steps.length) {
    return (
      <section className="coach-panel">
        <p className="section-label">Response Coach</p>
        <h2>No actions</h2>
      </section>
    );
  }

  const selectedStep =
    steps.find((step) => step.priority === selectedPriority) || steps[0];

  return (
    <section className="coach-panel">
      <div className="coach-header">
        <p className="section-label">Next Moves</p>
        <h2>Response stack</h2>
      </div>

      <div className="action-stack">
        {steps.map((step) => (
          <button
            key={step.priority}
            className={
              selectedStep.priority === step.priority
                ? "action-item active"
                : "action-item"
            }
            onClick={() => setSelectedPriority(step.priority)}
          >
            <span>{step.priority}</span>
            <strong>{step.action}</strong>
          </button>
        ))}
      </div>

      <div className="coach-detail">
        <span>{selectedStep.owner}</span>
        <p>{selectedStep.why}</p>
      </div>
    </section>
  );
}

export default ResponseCoach;