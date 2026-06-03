import { useState } from "react";

function ControlFailureLab({ scenarios = [] }) {
  const [selectedId, setSelectedId] = useState(scenarios[0]?.id || "");

  if (!scenarios.length) {
    return null;
  }

  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedId) || scenarios[0];

  return (
    <section className="side-panel">
      <p className="eyebrow">Control Failure Lab</p>
      <h2>Failure Simulation</h2>

      <div className="failure-buttons">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            className={selectedScenario.id === scenario.id ? "active" : ""}
            onClick={() => setSelectedId(scenario.id)}
          >
            {scenario.question}
          </button>
        ))}
      </div>

      <div className="failure-output">
        <span>Projected impact</span>
        <strong>{selectedScenario.likely_outcome}</strong>
        <p>{selectedScenario.recommended_control}</p>
      </div>
    </section>
  );
}

export default ControlFailureLab;