import { useState } from "react";
import { runResponseAction } from "../../api/splunkApi";

function ActionCard({ action, episode, onActionComplete }) {
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const isRealAction = action.execution_type === "real_kubernetes_action";

  async function handleRun() {
    setRunning(true);
    setError("");

    try {
      const response = await runResponseAction(action.api, {
        pod: episode?.pod || action.target,
        target: action.target,
        namespace: action.namespace || episode?.namespace,
        package: episode?.package,
        reason: episode?.episode_title,
      });

      setResult(response);

      if (onActionComplete) {
        await onActionComplete();
      }
    } catch (requestError) {
      setError(requestError.message || "Action failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <article className={`action-card ${isRealAction ? "real" : "simulated"}`}>
      <div className="action-card-header">
        <div>
          <span className="action-priority">Priority {action.priority}</span>
          <h3>{action.action}</h3>
        </div>

        <span className={`action-type ${isRealAction ? "real" : "simulated"}`}>
          {isRealAction ? "Real Kubernetes Action" : "Simulated Follow-up"}
        </span>
      </div>

      <p className="action-why">{action.why}</p>

      <div className="action-meta">
        <div>
          <span>Target</span>
          <strong>{action.target || "unknown"}</strong>
        </div>
        <div>
          <span>Namespace</span>
          <strong>{action.namespace || "default"}</strong>
        </div>
      </div>

      <button
        className="run-action-button"
        type="button"
        onClick={handleRun}
        disabled={running}
      >
        {running ? "Running..." : result ? "Run Again" : "Run Action"}
      </button>

      {error && <p className="action-error">{error}</p>}

      {result && (
        <div className="action-result">
          <div className="result-row">
            <span>Status</span>
            <strong>{result.status}</strong>
          </div>
          <div className="result-row">
            <span>Mode</span>
            <strong>{result.mode}</strong>
          </div>

          {result.details?.kubectl_result?.command && (
            <div className="command-box">
              <span>Command</span>
              <code>{result.details.kubectl_result.command}</code>
            </div>
          )}

          {result.details?.simulated_command && (
            <div className="command-box">
              <span>Simulated Command</span>
              <code>{result.details.simulated_command}</code>
            </div>
          )}

          {result.details?.network_policy_yaml && (
            <div className="command-box">
              <span>Generated NetworkPolicy</span>
              <pre>{result.details.network_policy_yaml}</pre>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function ContainmentActions({ episode, playbook, onActionComplete }) {
  const primaryActions = playbook.filter(
    (action) => action.category === "primary"
  );
  const followUpActions = playbook.filter(
    (action) => action.category === "follow_up"
  );

  return (
    <div className="containment-actions">
      <section className="action-section">
        <div className="section-heading">
          <p className="eyebrow">Primary Containment Actions</p>
          <h2>Kubernetes actions verified in this prototype</h2>
          <p>
            These actions are connected to the FastAPI backend. In Kubernetes
            mode, the backend executes kubectl commands against the local
            Docker Desktop Kubernetes cluster.
          </p>
        </div>

        <div className="action-grid">
          {primaryActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              episode={episode}
              onActionComplete={onActionComplete}
            />
          ))}
        </div>
      </section>

      <section className="action-section">
        <div className="section-heading">
          <p className="eyebrow">Recommended Follow-up Actions</p>
          <h2>Post-containment investigation steps</h2>
          <p>
            These are included to show the complete response workflow. They are
            simulated in this prototype but represent real actions a security
            or platform team would take after containment.
          </p>
        </div>

        <div className="action-grid">
          {followUpActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              episode={episode}
              onActionComplete={onActionComplete}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default ContainmentActions;