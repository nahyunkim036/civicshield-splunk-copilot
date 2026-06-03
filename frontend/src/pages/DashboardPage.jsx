function DashboardPage({ episodeData, auditData, onTabChange }) {
  const episode = episodeData?.episode;
  const attackMovie = episodeData?.attack_movie;
  const architectureMap = episodeData?.architecture_map;

  if (!episode) return null;

  return (
    <section className="command-center">
      <div className="hero-row">
        <div>
          <p className="eyebrow">Attack-to-Quarantine Pipeline</p>
          <h1>{episode.episode_title}</h1>
          <p>
            Splunk correlated container telemetry into a supply chain episode.
            The response agent is ready to isolate the affected workload.
          </p>
        </div>

        <button
          className="launch-button"
          onClick={() => onTabChange("attack-flow")}
        >
          Launch Attack Movie
        </button>
      </div>

      <section className="status-grid">
        <article>
          <span>Risk</span>
          <strong>{episode.risk_level}</strong>
        </article>

        <article>
          <span>Score</span>
          <strong>{episode.risk_score}</strong>
        </article>

        <article>
          <span>Containment</span>
          <strong>{episode.containment}</strong>
        </article>

        <article>
          <span>Audit Actions</span>
          <strong>{auditData?.count || 0}</strong>
        </article>
      </section>

      <section className="core-layout">
        <div className="architecture-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Architecture Map</p>
              <h2>Impacted Runtime Path</h2>
            </div>
          </div>

          <div className="architecture-map">
            {(architectureMap?.nodes || []).map((node) => (
              <div key={node.id} className={`arch-node status-${node.status}`}>
                <span>{node.type}</span>
                <strong>{node.label}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="episode-panel">
          <p className="eyebrow">Episode Target</p>

          <div className="target-list">
            <div>
              <span>Package</span>
              <strong>{episode.package}</strong>
            </div>

            <div>
              <span>Pod</span>
              <strong>{episode.pod}</strong>
            </div>

            <div>
              <span>Namespace</span>
              <strong>{episode.namespace}</strong>
            </div>

            <div>
              <span>Events</span>
              <strong>{episode.event_count}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="path-preview-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Attack Path</p>
            <h2>{attackMovie?.node_count || 0} correlated stages</h2>
          </div>

          <button
            className="ghost-button"
            onClick={() => onTabChange("attack-flow")}
          >
            Replay
          </button>
        </div>

        <div className="path-preview">
          {(attackMovie?.nodes || []).map((node) => (
            <div key={node.id} className={`path-preview-node severity-${node.severity}`}>
              <span>{String(node.step).padStart(2, "0")}</span>
              <strong>{node.label}</strong>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

export default DashboardPage;