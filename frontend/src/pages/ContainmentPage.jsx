import ContainmentActions from "../components/containment/ContainmentActions";

function AuditCard({ event }) {
  return (
    <article className="audit-card">
      <div>
        <span className="audit-action">{event.action_type}</span>
        <strong>{event.status}</strong>
      </div>
      <p>
        Target <strong>{event.target}</strong> in namespace{" "}
        <strong>{event.namespace}</strong>
      </p>
      <small>{event.timestamp}</small>
    </article>
  );
}

function RawEventRow({ event, onClick }) {
  return (
    <button className="raw-event-row" type="button" onClick={onClick}>
      <span>{event.timestamp}</span>
      <strong>{event.event_type}</strong>
      <span>{event.severity}</span>
      <span>{event.status}</span>
    </button>
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
    <div className="page-stack">
      <section className="containment-hero">
        <div>
          <p className="eyebrow">Containment</p>
          <h2>Run response actions for the affected pod</h2>
          <p>
            CivicShield turns Splunk evidence into clear response actions. The
            primary actions quarantine the affected Kubernetes Pod and apply a
            deny-egress NetworkPolicy.
          </p>
        </div>

        <aside className="containment-summary">
          <div>
            <span>Affected Pod</span>
            <strong>{episode?.pod || "unknown"}</strong>
          </div>
          <div>
            <span>Namespace</span>
            <strong>{episode?.namespace || "unknown"}</strong>
          </div>
          <div>
            <span>Current Status</span>
            <strong>{episode?.containment || "Containment Ready"}</strong>
          </div>
        </aside>
      </section>

      <ContainmentActions
        episode={episode}
        playbook={playbook}
        onActionComplete={onAuditRefresh}
      />

      <section className="content-grid two-column">
        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Audit Trail</p>
            <h3>Response actions recorded by CivicShield</h3>
          </div>

          <div className="audit-list">
            {(auditData?.events || []).length === 0 && (
              <p className="small-note">
                No response actions have been recorded yet.
              </p>
            )}

            {(auditData?.events || []).map((event) => (
              <AuditCard key={event.id} event={event} />
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Splunk Events</p>
            <h3>Raw evidence used for this case</h3>
          </div>

          <div className="raw-event-list">
            {(rawEvents || []).map((event, index) => (
              <RawEventRow
                key={`${event.timestamp}-${event.event_type}-${index}`}
                event={event}
                onClick={() =>
                  onLogSelect({
                    title: event.event_type,
                    subtitle: event.description,
                    type: "Raw Splunk Event",
                    data: event,
                  })
                }
              />
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default ContainmentPage;