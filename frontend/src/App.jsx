import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:8001";

function getPatternExplanation(pattern) {
  const explanations = {
    "Repeated failed logins from the same IP":
      "Multiple failed login attempts came from the same source IP.",
    "Successful login after repeated failures":
      "The same suspicious IP later completed a successful login.",
    "Sensitive file access detected":
      "A private student records file was accessed after suspicious login activity.",
    "Permission change detected after suspicious activity":
      "File permissions were changed after the suspicious sequence.",
  };

  return explanations[pattern] || "This pattern was detected from the Splunk logs.";
}

function getPatternClass(pattern) {
  if (pattern.includes("failed logins")) return "pattern-warning";
  if (pattern.includes("Successful login")) return "pattern-danger";
  if (pattern.includes("Sensitive file")) return "pattern-purple";
  if (pattern.includes("Permission change")) return "pattern-blue";
  return "pattern-neutral";
}

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSecurityData() {
      try {
        const analysisResponse = await fetch(`${API_BASE_URL}/api/splunk/analysis`);
        const logsResponse = await fetch(`${API_BASE_URL}/api/splunk/logs`);

        if (!analysisResponse.ok || !logsResponse.ok) {
          throw new Error("Failed to fetch data from FastAPI backend");
        }

        const analysisData = await analysisResponse.json();
        const logsData = await logsResponse.json();

        setAnalysis(analysisData);
        setLogs(logsData.events || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSecurityData();
  }, []);

  const logStats = useMemo(() => {
    return {
      failed: logs.filter((log) => log.status === "failed").length,
      warning: logs.filter((log) => log.status === "warning").length,
      success: logs.filter((log) => log.status === "success").length,
    };
  }, [logs]);

  if (loading) {
    return (
      <main className="page">
        <div className="state-card">Loading CivicShield AI...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <div className="state-card error-card">Error: {error}</div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <p>CivicShield AI</p>
            <span>Splunk-powered security dashboard</span>
          </div>
        </div>

        <nav className="nav">
          <span className="active">Dashboard</span>
          <span>Evidence</span>
          <span>Analysis</span>
        </nav>

        <div className="backend-status">
          <span className="status-dot" />
          Backend Connected
        </div>
      </header>

      <section className="hero-section">
        <div>
          <p className="eyebrow">Security Copilot</p>
          <h1>Incident Review Dashboard</h1>
          <p className="subtitle">
            Review suspicious activity detected from Splunk logs and understand the evidence behind the analysis.
          </p>
        </div>
      </section>

      {analysis && (
        <>
          <section className="summary-grid">
            <article className="summary-card risk-summary">
              <p className="card-label">Risk Level</p>
              <div className="summary-value-row">
                <strong>{analysis.risk_level}</strong>
                <span className="risk-pill">{analysis.risk_level} Risk</span>
              </div>
              <p>Priority based on detected log patterns.</p>
            </article>

            <article className="summary-card">
              <p className="card-label">Events Analyzed</p>
              <strong>{analysis.total_events_analyzed}</strong>
              <p>Logs retrieved from the Splunk index.</p>
            </article>

            <article className="summary-card">
              <p className="card-label">Evidence Items</p>
              <strong>{analysis.evidence_count}</strong>
              <p>Signals used in the incident decision.</p>
            </article>

            <article className="summary-card">
              <p className="card-label">Confidence</p>
              <strong>{analysis.confidence}</strong>
              <p>Rule-based detection confidence.</p>
            </article>
          </section>

          <section className="main-grid">
            <article className="panel incident-card">
              <div className="panel-header">
                <div>
                  <p className="card-label">Incident Analysis</p>
                  <h2>{analysis.incident_type}</h2>
                </div>
              </div>

              <p className="incident-text">{analysis.summary}</p>

              <div className="callout">
                <span className="callout-icon">!</span>
                <div>
                  <strong>Main concern</strong>
                  <p>
                    Failed admin login attempts were followed by a successful login, sensitive file access,
                    and a permission change.
                  </p>
                </div>
              </div>
            </article>

            <aside className="panel health-card">
              <div className="panel-header">
                <div>
                  <p className="card-label">Log Status</p>
                  <h2>{logs.length} Events</h2>
                </div>
              </div>

              <div className="donut">
                <div className="donut-hole">
                  <strong>{logs.length}</strong>
                  <span>Total</span>
                </div>
              </div>

              <div className="legend">
                <div>
                  <span className="legend-dot failed" />
                  <p>Failed</p>
                  <strong>{logStats.failed}</strong>
                </div>
                <div>
                  <span className="legend-dot warning" />
                  <p>Warning</p>
                  <strong>{logStats.warning}</strong>
                </div>
                <div>
                  <span className="legend-dot success" />
                  <p>Success</p>
                  <strong>{logStats.success}</strong>
                </div>
              </div>
            </aside>
          </section>

          <section className="panel patterns-panel">
            <div className="panel-header">
              <div>
                <p className="card-label">Detected Patterns</p>
                <h2>Suspicious sequence found</h2>
              </div>
              <span className="small-pill">{analysis.detected_patterns?.length || 0} patterns</span>
            </div>

            <div className="patterns-grid">
              {analysis.detected_patterns?.map((pattern, index) => (
                <article className={`pattern-card ${getPatternClass(pattern)}`} key={index}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{pattern}</strong>
                    <p>{getPatternExplanation(pattern)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="panel logs-panel">
        <div className="panel-header">
          <div>
            <p className="card-label">Splunk Evidence</p>
            <h2>Security Logs</h2>
            <p className="panel-subtitle">
              Raw activity retrieved from Splunk and structured through the FastAPI backend.
            </p>
          </div>
          <span className="small-pill">{logs.length} events</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>User</th>
                <th>Source IP</th>
                <th>Status</th>
                <th>Resource</th>
                <th>Description</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log, index) => (
                <tr key={index}>
                  <td className="timestamp-cell">{log.timestamp}</td>
                  <td>
                    <span className="event-chip">{log.event_type}</span>
                  </td>
                  <td>{log.user}</td>
                  <td className="ip-cell">{log.src_ip}</td>
                  <td>
                    <span className={`status-badge status-${log.status}`}>
                      {log.status}
                    </span>
                  </td>
                  <td>{log.resource}</td>
                  <td>{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default App;