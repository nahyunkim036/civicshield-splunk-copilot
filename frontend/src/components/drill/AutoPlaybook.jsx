import { useState } from "react";
import { runResponseAction } from "../../api/splunkApi";

function AutoPlaybook({ steps = [], episode, onActionComplete }) {
  const [runningActionId, setRunningActionId] = useState("");
  const [actionResults, setActionResults] = useState({});

  if (!steps.length) {
    return (
      <section className="side-panel">
        <p className="eyebrow">Auto Playbook</p>
        <h2>No actions</h2>
      </section>
    );
  }

  async function handleRunAction(step) {
    try {
      setRunningActionId(step.id);

      const result = await runResponseAction(step.api, {
        pod: episode?.pod || step.target,
        target: step.target,
        namespace: step.namespace || episode?.namespace,
        package: episode?.package,
        reason: episode?.episode_title,
      });

      setActionResults((current) => ({
        ...current,
        [step.id]: result,
      }));

      if (onActionComplete) {
        await onActionComplete();
      }
    } catch (error) {
      setActionResults((current) => ({
        ...current,
        [step.id]: {
          status: "failed",
          details: { error: error.message },
        },
      }));
    } finally {
      setRunningActionId("");
    }
  }

  return (
    <section className="side-panel">
      <p className="eyebrow">Auto Playbook</p>
      <h2>Response Actions</h2>

      <div className="playbook-list">
        {steps.map((step) => {
          const result = actionResults[step.id];
          const isRunning = runningActionId === step.id;

          return (
            <article key={step.id} className={result ? "action-card done" : "action-card"}>
              <div>
                <span>{String(step.priority).padStart(2, "0")}</span>
                <strong>{step.action}</strong>
                <p>{step.target}</p>
              </div>

              <button onClick={() => handleRunAction(step)} disabled={isRunning}>
                {isRunning ? "Running" : result ? "Done" : "Run"}
              </button>

              {result && (
                <code>
                  {result.status}:{" "}
                  {result.details?.simulated_command ||
                    result.details?.simulated_action ||
                    result.details?.production_action}
                </code>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default AutoPlaybook;