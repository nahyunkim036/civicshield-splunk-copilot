import { useMemo, useState } from "react";
import { runResponseAction } from "../../api/splunkApi";

function ActionButton({ action, isSelected, onClick }) {
  const isRealAction = action.execution_type === "real_kubernetes_action";

  return (
    <button
      type="button"
      className={`containment-action-button ${isSelected ? "selected" : ""} ${
        isRealAction ? "real" : "simulated"
      }`}
      onClick={onClick}
    >
      <span className="action-number">{String(action.priority).padStart(2, "0")}</span>

      <span className="action-button-copy">
        <strong>{action.action}</strong>
        <small>
          {isRealAction ? "Kubernetes execution" : "Recommended follow-up"}
        </small>
      </span>

      <span className="action-dot" />
    </button>
  );
}

function ResultBlock({ result }) {
  if (!result) return null;

  return (
    <section className="containment-result">
      <div className="result-topline">
        <div>
          <span>Status</span>
          <strong>{result.status}</strong>
        </div>
        <div>
          <span>Mode</span>
          <strong>{result.mode}</strong>
        </div>
      </div>

      {result.details?.kubectl_result?.command && (
        <div className="command-box">
          <span>Executed Command</span>
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

      {result.details?.recommended_actions && (
        <div className="recommendation-list">
          <span>Recommended Actions</span>
          {result.details.recommended_actions.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      )}
    </section>
  );
}

function ActionDetailPanel({
  action,
  episode,
  result,
  running,
  error,
  onRun,
}) {
  if (!action) {
    return (
      <aside className="containment-detail-panel empty">
        <p className="eyebrow">Containment Detail</p>
        <h3>Select an action</h3>
        <p>
          Choose a containment action to see what it does, why it matters, and
          whether it runs as a real Kubernetes action or simulated follow-up.
        </p>
      </aside>
    );
  }

  const isRealAction = action.execution_type === "real_kubernetes_action";

  return (
    <aside className={`containment-detail-panel active ${isRealAction ? "real" : "simulated"}`}>
      <div className="containment-detail-header">
        <div>
          <p className="eyebrow">
            {isRealAction ? "Primary Kubernetes Action" : "Recommended Follow-up"}
          </p>
          <h3>{action.action}</h3>
        </div>

        <span className={`execution-badge ${isRealAction ? "real" : "simulated"}`}>
          {isRealAction ? "Real" : "Simulated"}
        </span>
      </div>

      <p className="containment-detail-copy">{action.why}</p>

      <div className="containment-target-grid">
        <div>
          <span>Target</span>
          <strong>{action.target || episode?.pod || "unknown"}</strong>
        </div>
        <div>
          <span>Namespace</span>
          <strong>{action.namespace || episode?.namespace || "default"}</strong>
        </div>
        <div>
          <span>Case</span>
          <strong>{episode?.episode_title || "Supply Chain Incident"}</strong>
        </div>
        <div>
          <span>Action Type</span>
          <strong>
            {isRealAction ? "Kubernetes command" : "Workflow recommendation"}
          </strong>
        </div>
      </div>

      <div className="containment-explainer">
        {action.id === "quarantine_pod" && (
          <p>
            This applies <code>civicshield.ai/quarantine=true</code> to the
            affected Pod. The label marks the Pod as a containment target.
          </p>
        )}

        {action.id === "apply_network_policy" && (
          <p>
            This generates and applies a deny-egress Kubernetes NetworkPolicy
            targeting Pods with the quarantine label.
          </p>
        )}

        {action.id === "rotate_service_account" && (
          <p>
            This represents the follow-up step of rotating exposed Kubernetes
            credentials after token access is observed.
          </p>
        )}

        {action.id === "open_dependency_review" && (
          <p>
            This represents a dependency investigation workflow for the
            suspicious open-source package that triggered the incident.
          </p>
        )}
      </div>

      <button
        className="run-action-button containment-run"
        type="button"
        onClick={onRun}
        disabled={running}
      >
        {running ? "Running..." : result ? "Run Again" : "Run Action"}
      </button>

      {error && <p className="action-error">{error}</p>}

      <ResultBlock result={result} />
    </aside>
  );
}

function ContainmentActions({ episode, playbook, onActionComplete }) {
  const [selectedActionId, setSelectedActionId] = useState(
    playbook?.[0]?.id || ""
  );
  const [resultsByAction, setResultsByAction] = useState({});
  const [runningActionId, setRunningActionId] = useState("");
  const [errorsByAction, setErrorsByAction] = useState({});

  const selectedAction = useMemo(() => {
    return playbook.find((action) => action.id === selectedActionId) || playbook[0];
  }, [playbook, selectedActionId]);

  const primaryActions = playbook.filter(
    (action) => action.category === "primary"
  );

  const followUpActions = playbook.filter(
    (action) => action.category === "follow_up"
  );

  async function handleRunSelectedAction() {
    if (!selectedAction) return;

    setRunningActionId(selectedAction.id);
    setErrorsByAction((current) => ({
      ...current,
      [selectedAction.id]: "",
    }));

    try {
      const response = await runResponseAction(selectedAction.api, {
        pod: episode?.pod || selectedAction.target,
        target: selectedAction.target,
        namespace: selectedAction.namespace || episode?.namespace,
        package: episode?.package,
        reason: episode?.episode_title,
      });

      setResultsByAction((current) => ({
        ...current,
        [selectedAction.id]: response,
      }));

      if (onActionComplete) {
        await onActionComplete();
      }
    } catch (requestError) {
      setErrorsByAction((current) => ({
        ...current,
        [selectedAction.id]: requestError.message || "Action failed.",
      }));
    } finally {
      setRunningActionId("");
    }
  }

  return (
    <section className="containment-command-center">
      <div className="containment-action-rail">
        <div className="action-group">
          <p className="eyebrow">Primary Actions</p>
          <h3>Kubernetes containment</h3>

          <div className="action-button-stack">
            {primaryActions.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                isSelected={selectedAction?.id === action.id}
                onClick={() => setSelectedActionId(action.id)}
              />
            ))}
          </div>
        </div>

        <div className="action-group">
          <p className="eyebrow">Follow-up Actions</p>
          <h3>Investigation workflow</h3>

          <div className="action-button-stack">
            {followUpActions.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                isSelected={selectedAction?.id === action.id}
                onClick={() => setSelectedActionId(action.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <ActionDetailPanel
        action={selectedAction}
        episode={episode}
        result={resultsByAction[selectedAction?.id]}
        running={runningActionId === selectedAction?.id}
        error={errorsByAction[selectedAction?.id]}
        onRun={handleRunSelectedAction}
      />
    </section>
  );
}

export default ContainmentActions;