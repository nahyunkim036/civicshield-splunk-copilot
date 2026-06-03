function getPrimaryIp(logs) {
  return logs.find((log) => log.src_ip)?.src_ip || "Unknown";
}

function getBlockedCount(logs) {
  return logs.filter((log) => log.status === "blocked").length;
}

function getFailedLoginCount(logs) {
  return logs.filter(
    (log) => log.event_type === "login" && log.status === "failed"
  ).length;
}

function DashboardPage({ analysis, attackFlow, story, logs, onTabChange }) {
  const primaryIp = getPrimaryIp(logs);
  const blockedCount = getBlockedCount(logs);
  const failedLoginCount = getFailedLoginCount(logs);

  const incidentTitle =
    story?.story_title || analysis?.incident_type || "Incident Drill";

  const outcome = story?.outcome || "Review";
  const stageCount = story?.timeline_count || attackFlow?.node_count || 0;

  return (
    <section className="command-center">
      <div className="command-hero">
        <div>
          <p className="eyebrow">Autonomous Incident Drill Agent</p>
          <h1>{incidentTitle}</h1>
          <p>
            Splunk evidence converted into a replayable attack drill, control
            simulation, and response playbook.
          </p>
        </div>

        <button
          className="launch-button"
          onClick={() => onTabChange("attack-flow")}
        >
          <span>Launch</span>
          Attack Movie
        </button>
      </div>

      <div className="command-grid">
        <section className="incident-status-panel">
          <div className="status-orbit">
            <div className="status-core">
              <span>{analysis?.risk_level || "Risk"}</span>
              <strong>{outcome}</strong>
            </div>
          </div>

          <div className="status-copy">
            <p className="eyebrow">Current Drill</p>
            <h2>{stageCount} stage attack path</h2>
            <p>
              The agent identified a compact attack sequence from Splunk logs
              and prepared it for replay.
            </p>
          </div>
        </section>

        <section className="signal-strip">
          <article>
            <span>Source IP</span>
            <strong>{primaryIp}</strong>
          </article>

          <article>
            <span>Failed Logins</span>
            <strong>{failedLoginCount}</strong>
          </article>

          <article>
            <span>Blocked</span>
            <strong>{blockedCount}</strong>
          </article>

          <article>
            <span>Evidence</span>
            <strong>{logs.length}</strong>
          </article>
        </section>

        <section className="mini-attack-path">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Attack Path Preview</p>
              <h2>{attackFlow?.flow_title || "Attack Flow"}</h2>
            </div>

            <button
              className="ghost-button"
              onClick={() => onTabChange("attack-flow")}
            >
              Open
            </button>
          </div>

          <div className="path-rail">
            {(attackFlow?.nodes || []).slice(0, 5).map((node, index) => (
              <div key={node.id} className={`path-node severity-${node.severity}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{node.label}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="compact-playbook">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Auto Playbook</p>
              <h2>Next moves</h2>
            </div>
          </div>

          <div className="playbook-preview">
            {(story?.response_coach || []).slice(0, 4).map((step) => (
              <div key={step.priority}>
                <span>{step.priority}</span>
                <strong>{step.action}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default DashboardPage;