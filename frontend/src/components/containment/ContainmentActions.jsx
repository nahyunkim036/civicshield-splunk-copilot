import { useMemo, useState } from "react";
import { runResponseAction } from "../../api/splunkApi";

function ActionTile({ action, selected, onClick }) {
  const real = action.execution_type === "real_kubernetes_action";

  return (
    <button
      type="button"
      className={`action-tile ${selected ? "selected" : ""} ${
        real ? "real" : "simulated"
      }`}
      onClick={onClick}
    >
      <span>{String(action.priority).padStart(2, "0")}</span>
      <div>
        <strong>{action.action}</strong>
        <small>{real ? "Kubernetes action" : "Follow-up workflow"}</small>
      </div>
    </button>
  );
}

function Field({ label, value }) {
  return (
    <div className="field">
      <span>{label}</span>
      <strong>{value || "unknown"}</strong>
    </div>
  );
}

function ResultBox({ result }) {
  if (!result) return null;

  return (
    <div className="result-box">
      <div className="field-grid">
        <Field label="Status" value={result.status} />
        <Field label="Mode" value={result.mode} />
      </div>

      {result.details?.kubectl_result?.command && (
        <div className="code-box">
          <span>Executed command</span>
          <code>{result.details.kubectl_result.command}</code>
        </div>
      )}

      {result.details?.simulated_command && (
        <div className="code-box">
          <span>Simulated command</span>
          <code>{result.details.simulated_command}</code>
        </div>
      )}

      {result.details?.network_policy_yaml && (
        <div className="code-box">
          <span>NetworkPolicy YAML</span>
          <pre>{result.details.network_policy_yaml}</pre>
        </div>
      )}
    </div>
  );
}

function ContainmentActions({ episode, playbook, onActionComplete }) {
  const [selectedActionId, setSelectedActionId] = useState(playbook?.[0]?.id || "");
  const [resultsByAction, setResultsByAction] = useState({});
  const [errorsByAction, setErrorsByAction] = useState({});
  const [runningActionId, setRunningActionId] = useState("");

  const selectedAction = useMemo(() => {
    return playbook.find((action) => action.id === selectedActionId) || playbook[0];
  }, [playbook, selectedActionId]);

  const primaryActions = playbook.filter((action) => action.category === "primary");
  const followUpActions = playbook.filter((action) => action.category === "follow_up");

  async function runSelectedAction() {
    if (!selectedAction) return;

    setRunningActionId(selectedAction.id);
    setErrorsByAction((current) => ({ ...current, [selectedAction.id]: "" }));

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

      if (onActionComplete) await onActionComplete();
    } catch (error) {
      setErrorsByAction((current) => ({
        ...current,
        [selectedAction.id]: error.message || "Action failed.",
      }));
    } finally {
      setRunningActionId("");
    }
  }

  const selectedResult = resultsByAction[selectedAction?.id];
  const selectedError = errorsByAction[selectedAction?.id];
  const isReal = selectedAction?.execution_type === "real_kubernetes_action";

  return (
    <section className="response-board">
      <aside className="response-list">
        <div className="response-group">
          <p className="eyebrow">Primary</p>
          <h2>Kubernetes containment</h2>

          {primaryActions.map((action) => (
            <ActionTile
              key={action.id}
              action={action}
              selected={selectedAction?.id === action.id}
              onClick={() => setSelectedActionId(action.id)}
            />
          ))}
        </div>

        <div className="response-group">
          <p className="eyebrow">Follow-up</p>
          <h2>Investigation steps</h2>

          {followUpActions.map((action) => (
            <ActionTile
              key={action.id}
              action={action}
              selected={selectedAction?.id === action.id}
              onClick={() => setSelectedActionId(action.id)}
            />
          ))}
        </div>
      </aside>

      <article className={`response-detail ${isReal ? "real" : "simulated"}`}>
        <div className="response-detail-header">
          <div>
            <p className="eyebrow">{isReal ? "Real action" : "Recommended step"}</p>
            <h2>{selectedAction?.action}</h2>
          </div>
          <span>{isReal ? "Kubernetes" : "Workflow"}</span>
        </div>

        <p>{selectedAction?.why}</p>

        <div className="field-grid">
          <Field label="Target" value={selectedAction?.target || episode?.pod} />
          <Field label="Namespace" value={selectedAction?.namespace || episode?.namespace} />
          <Field label="Case" value={episode?.episode_title} />
          <Field label="Execution" value={isReal ? "kubectl-backed" : "simulated"} />
        </div>

        <button
          type="button"
          className="run-action-button"
          onClick={runSelectedAction}
          disabled={runningActionId === selectedAction?.id}
        >
          {runningActionId === selectedAction?.id
            ? "Running..."
            : selectedResult
              ? "Run again"
              : "Run action"}
        </button>

        {selectedError && <p className="error-text">{selectedError}</p>}

        <ResultBox result={selectedResult} />
      </article>
    </section>
  );
}

export default ContainmentActions;