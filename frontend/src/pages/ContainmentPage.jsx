import ContainmentActions from "../components/containment/ContainmentActions";

function AuditCard({ event }) {
  return (
    <article className="audit-card">
      <div>
        <span>{event.action_type}</span>
        <strong>{event.status}</strong>
      </div>
      <p>
        Target <code>{event.target}</code> in namespace{" "}
        <code>{event.namespace}</code>
      </p>
      <small>{event.timestamp}</small>
    </article>
  );
}

function ContainmentPage({
  episode,
  playbook,
  rawEvents,
  auditData,
  onAuditRefresh,
  onLogSelect,
}) {
  return (
    <div className="response-page">
      <section className="hero-panel compact">
        <div className="hero-copy">
          <p className="eyebrow">Response</p>
          <h1>Contain the affected workload</h1>
          <p>
            Pick one action, review what it does, then run it. Primary actions
            can execute against Kubernetes mode.
          </p>
        </div>

        <div className="summary-panel">
          <div>
            <span>Pod</span>
            <strong>{episode?.pod || "unknown"}</strong>
          </div>
          <div>
            <span>Namespace</span>
            <strong>{episode?.namespace || "unknown"}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{episode?.containment || "Ready"}</strong>
          </div>
        </div>
      </section>

      <ContainmentActions
        episode={episode}
        playbook={playbook}
        onActionComplete={onAuditRefresh}
      />

      <section className="bottom-grid">
        <article className="panel">
          <div className="panel-head simple">
            <div>
              <p className="eyebrow">Audit</p>
              <h2>Recorded actions</h2>
            </div>
          </div>

          <div className="audit-list">
            {(auditData?.events || []).length === 0 && (
              <p className="muted">No response actions recorded yet.</p>
            )}

            {(auditData?.events || []).map((event) => (
              <AuditCard key={event.id} event={event} />
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head simple">
            <div>
              <p className="eyebrow">Raw Evidence</p>
              <h2>Splunk events</h2>
            </div>
          </div>

          <div className="raw-list">
            {(rawEvents || []).map((event, index) => (
              <button
                key={`${event.timestamp}-${event.event_type}-${index}`}
                type="button"
                className="raw-row"
                onClick={() =>
                  onLogSelect({
                    type: "Raw Splunk event",
                    title: event.event_type,
                    subtitle: event.description,
                    data: event,
                  })
                }
              >
                <span>{event.timestamp}</span>
                <strong>{event.event_type}</strong>
                <span>{event.severity}</span>
                <span>{event.status}</span>
              </button>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default ContainmentPage;