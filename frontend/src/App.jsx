import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:8001";

function getPatternExplanation(pattern) {
  const explanations = {
    "Repeated failed logins from the same IP":
      "Multiple failed login attempts were detected from one source IP. This can indicate brute-force or credential guessing.",
    "Successful login after repeated failures":
      "The same suspicious IP eventually logged in successfully, which makes the sequence more concerning.",
    "Sensitive file access detected":
      "A private student records file was accessed after the suspicious login activity.",
    "Permission change detected after suspicious activity":
      "File permissions were changed after the suspicious sequence, which may increase data exposure risk.",
  };

  return explanations[pattern] || "This pattern was detected from the Splunk security logs.";
}

function getPatternTone(pattern) {
  if (pattern.includes("failed logins")) return "orange";
  if (pattern.includes("Successful login")) return "red";
  if (pattern.includes("Sensitive file")) return "purple";
  if (pattern.includes("Permission change")) return "blue";
  return "gray";
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

  if (loading) {
    return (
      <div className="page">
        <div className="loading-card">
          <div className="loader-dot" />
          <p>Loading CivicShield AI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-card">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-center">
          <div className="hero-badge">Splunk → FastAPI → React</div>
          <p className="eyebrow">Splunk-powered Security Copilot</p>
          <h1>CivicShield AI</h1>
          <p className="subtitle">
            A clean test dashboard for verifying backend integration, incident analysis,
            and Splunk evidence retrieval.
          </p>
        </div>

        <div className="connection-card">
          <div className="connection-dot" />
          <div>
            <strong>Backend Connected</strong>
            <span>Live data from FastAPI</span>
          </div>
        </div>
      </header>

      {analysis && (
        <section className="card incident-panel">
          <div className="incident-top">
            <div className="incident-copy">
              <div className="section-kicker">
                <span className="kicker-dot red-dot" />
                Incident Analysis
              </div>

              <h2>{analysis.incident_type}</h2>

              <p className="incident-description">{analysis.summary}</p>

              <div className="quick-alert">
                <strong>Why this matters:</strong>
                <span>
                  This sequence shows failed admin logins, a later successful login,
                  sensitive file access, and a permission change.
                </span>
              </div>
            </div>

            <div className="risk-panel">
              <div className="risk-top">
                <span className={`risk-badge risk-${analysis.risk_level?.toLowerCase()}`}>
                  {analysis.risk_level} Risk
                </span>
                <p>Priority incident</p>
              </div>

              <div className="risk-score">
                <span>Risk Score</span>
                <strong>87</strong>
                <p>Based on {analysis.detected_patterns?.length || 0} detected patterns</p>
              </div>

              <div className="risk-meta">
                <div>
                  <p className="label">Confidence</p>
                  <strong>{analysis.confidence}</strong>
                </div>

                <div>
                  <p className="label">Events</p>
                  <strong>{analysis.total_events_analyzed}</strong>
                </div>

                <div>
                  <p className="label">Evidence</p>
                  <strong>{analysis.evidence_count}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="analysis-divider" />

          <div className="pattern-section">
            <div className="pattern-heading">
              <div className="section-kicker">
                <span className="kicker-dot blue-dot" />
                Detected Patterns
              </div>
              <h3>Suspicious sequence found</h3>
              <p>
                CivicShield grouped the Splunk logs into a readable incident chain so
                non-expert users can understand what happened.
              </p>
            </div>

            <div className="pattern-list-clean">
              {analysis.detected_patterns?.map((pattern, index) => (
                <div className={`pattern-row pattern-${getPatternTone(pattern)}`} key={index}>
                  <div className="pattern-number">{index + 1}</div>
                  <div>
                    <strong>{pattern}</strong>
                    <p>{getPatternExplanation(pattern)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="card evidence-card">
        <div className="section-header">
          <div>
            <div className="section-kicker">
              <span className="kicker-dot green-dot" />
              Splunk Evidence
            </div>
            <h2>Security Logs</h2>
            <p className="table-subtitle">
              Raw security activity retrieved from Splunk and structured by FastAPI.
            </p>
          </div>

          <div className="count-pill">{logs.length} events</div>
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
                <tr
                  key={index}
                  className={
                    log.status === "failed"
                      ? "row-failed"
                      : log.status === "warning"
                      ? "row-warning"
                      : "row-success"
                  }
                >
                  <td className="timestamp-cell">{log.timestamp}</td>
                  <td>
                    <span className="event-chip">{log.event_type}</span>
                  </td>
                  <td>{log.user}</td>
                  <td className="ip-cell">{log.src_ip}</td>
                  <td>
                    <span className={`status status-${log.status}`}>
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
    </div>
  );
}

export default App;