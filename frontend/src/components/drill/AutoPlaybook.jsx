import { useState } from "react";
import { runResponseAction } from "../../api/splunkApi";

function AutoPlaybook({ steps = [], episode }) {
  const [runningActionId, setRunningActionId] = useState("");
  const [actionResults, setActionResults] = useState({});

  if (!steps.length) {
    return (
      <section className="drill-side-panel">
        <p className="eyebrow">Auto Playbook</p>
        <h2>No playbook</h2>
      </section>
    );
  }

  async function handleRunAction(step) {
    try {
      setRunningActionId(step.id);

      const payload = {
        pod: episode?.pod || step.target,
        target: step.target,
        namespace: step.namespace || episode?.namespace,
        package: episode?.package,
        reason: episode?.episode_title,
      };

      const result = await runResponseAction(step.api, payload);

      setActionResults((current) => ({
        ...current,
        [step.id]: result,
      }));
    } catch (error) {
      setActionResults((current) => ({
        ...current,
        [step.id]: {
          status: "failed",
          details: {
            error: error.message,
          },
        },
      }));
    } finally {
      setRunningActionId("");
    }
  }

  return (
    <section className="drill-side-panel">
      <p className="eyebrow">Auto Playbook</p>
      <h2>Containment actions</h2>

      <div className="auto-playbook-list">
        {steps.slice(0, 5).map((step) => {
          const result = actionResults[step.id];
          const isRunning = runningActionId === step.id;

          return (
            <article
              key={step.id}
              className={result ? "playbook-action executed" : "playbook-action"}
            >
              <span>{step.priority}</span>

              <div>
                <strong>{step.action}</strong>
                <p>{step.target}</p>

                <button
                  className="run-action-button"
                  onClick={() => handleRunAction(step)}
                  disabled={isRunning}
                >
                  {isRunning
                    ? "Running..."
                    : result
                      ? result.status
                      : "Run action"}
                </button>

                {result && (
                  <div className="action-result">
                    <small>{result.action_type}</small>
                    <code>
                      {result.details?.simulated_command ||
                        result.details?.simulated_action ||
                        result.details?.production_action}
                    </code>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default AutoPlaybook;