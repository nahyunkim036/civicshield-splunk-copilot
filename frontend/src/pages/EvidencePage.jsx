import { getStatusTone } from "../utils/statusUtils";

function EvidencePage({ logs, onLogSelect }) {
  return (
    <div className="page-stack">
      <section className="hero-glass smaller-hero">
        <p className="section-label">Splunk Evidence</p>
        <h1>Security Logs</h1>
        <p>
          These are the structured events retrieved from Splunk through the FastAPI
          backend.
        </p>
      </section>

      <section className="glass-panel evidence-panel">
        <div className="panel-heading">
          <div>
            <p className="section-label">Evidence Table</p>
            <h2>{logs.length} events</h2>
          </div>

          <span className="soft-pill">Click row for detail</span>
        </div>

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event</th>
                <th>User</th>
                <th>Source IP</th>
                <th>Status</th>
                <th>Resource</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log, index) => (
                <tr key={`${log.timestamp}-${index}`} onClick={() => onLogSelect(log)}>
                  <td>{log.timestamp}</td>
                  <td>{log.event_type}</td>
                  <td>{log.user}</td>
                  <td className="mono">{log.src_ip}</td>
                  <td>
                    <span className={`status-badge tone-${getStatusTone(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td>{log.resource}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default EvidencePage;