import { useState } from "react";

function WhatIfSimulator({ scenarios = [] }) {
  const [selectedId, setSelectedId] = useState(scenarios[0]?.id || "");

  if (!scenarios.length) {
    return (
      <section className="story-panel">
        <p className="section-label">What-If Simulator</p>
        <h2>No simulation available</h2>
      </section>
    );
  }

  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedId) || scenarios[0];

  return (
    <section className="story-panel what-if-panel">
      <div className="panel-heading compact">
        <div>
          <p className="section-label">What-If Simulator</p>
          <h2>Test alternate outcomes</h2>
        </div>
      </div>

      <div className="what-if-options">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            className={
              selectedScenario.id === scenario.id
                ? "what-if-chip active"
                : "what-if-chip"
            }
            onClick={() => setSelectedId(scenario.id)}
          >
            {scenario.question}
          </button>
        ))}
      </div>

      <div className="simulation-result">
        <p className="section-label">Likely Outcome</p>
        <h3>{selectedScenario.question}</h3>

        <div className="simulation-grid">
          <div>
            <span>Outcome</span>
            <p>{selectedScenario.likely_outcome}</p>
          </div>

          <div>
            <span>Potential Impact</span>
            <p>{selectedScenario.potential_impact}</p>
          </div>

          <div>
            <span>Recommended Control</span>
            <p>{selectedScenario.recommended_control}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhatIfSimulator;