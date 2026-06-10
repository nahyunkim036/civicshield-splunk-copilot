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

function TargetChip({ label, value }) {
  return (
    <div className="target-chip">
      <span>{label}</span>
      <strong>{value || "unknown"}</strong>
    </div>
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
    <div className="response-page compact-response">
      <section className="response-mini-header">
        <div>
          <p className="eyebrow">🛡️ Response</p>
          <h1>Containment actions</h1>
        </div>

        <div className="target-strip">
          <TargetChip label="Pod" value={episode?.pod} />
          <TargetChip label="Namespace" value={episode?.namespace} />
          <TargetChip label="Status" value={episode?.containment} />
        </div>
      </section>

      <ContainmentActions
        episode={episode}
        playbook={playbook}
        onActionComplete={onAuditRefresh}
      />

      <section className="bottom-grid compact-bottom-grid">
        <article className="panel compact-panel">
          <div className="panel-head simple">
            <div>
              <p className="eyebrow">Audit</p>
              <h2>Action history</h2>
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

        <article className="panel compact-panel">
          <div className="panel-head simple">
            <div>
              <p className="eyebrow">Evidence</p>
              <h2>Source events</h2>
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