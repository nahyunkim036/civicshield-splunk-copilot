import { useState } from "react";

function ControlFailureLab({ scenarios = [] }) {
  const [selectedId, setSelectedId] = useState(scenarios[0]?.id || "");

  if (!scenarios.length) {
    return (
      <section className="drill-side-panel">
        <p className="eyebrow">Control Failure Lab</p>
        <h2>No simulations</h2>
      </section>
    );
  }

  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedId) || scenarios[0];

  return (
    <section className="drill-side-panel">
      <p className="eyebrow">Control Failure Lab</p>
      <h2>Break one defense</h2>

      <div className="failure-options">
        {scenarios.slice(0, 4).map((scenario) => (
          <button
            key={scenario.id}
            className={
              selectedScenario.id === scenario.id
                ? "failure-option active"
                : "failure-option"
            }
            onClick={() => setSelectedId(scenario.id)}
          >
            {scenario.question}
          </button>
        ))}
      </div>

      <div className="failure-result">
        <div className="risk-chip">
          <span />
          Risk path changes
        </div>

        <h3>{selectedScenario.likely_outcome}</h3>

        <p>{selectedScenario.recommended_control}</p>
      </div>
    </section>
  );
}

export default ControlFailureLab;