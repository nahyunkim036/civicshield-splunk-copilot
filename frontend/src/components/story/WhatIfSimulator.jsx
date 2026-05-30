import { useState } from "react";

function WhatIfSimulator({ scenarios = [] }) {
  const [selectedId, setSelectedId] = useState(scenarios[0]?.id || "");

  if (!scenarios.length) {
    return (
      <section className="sim-panel">
        <p className="section-label">What-If</p>
        <h2>No simulation</h2>
      </section>
    );
  }

  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedId) || scenarios[0];

  return (
    <section className="sim-panel">
      <div className="sim-header">
        <p className="section-label">What-If Lab</p>
        <h2>Change one control</h2>
      </div>

      <div className="sim-options">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            className={
              selectedScenario.id === scenario.id
                ? "sim-option active"
                : "sim-option"
            }
            onClick={() => setSelectedId(scenario.id)}
          >
            {scenario.question}
          </button>
        ))}
      </div>

      <div className="sim-result-card">
        <div className="risk-pulse">
          <span />
          <strong>Risk shift</strong>
        </div>

        <h3>{selectedScenario.question}</h3>

        <div className="sim-mini-grid">
          <div>
            <span>Outcome</span>
            <p>{selectedScenario.likely_outcome}</p>
          </div>

          <div>
            <span>Control</span>
            <p>{selectedScenario.recommended_control}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhatIfSimulator;