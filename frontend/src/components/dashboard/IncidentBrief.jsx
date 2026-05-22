import { motion } from "framer-motion";

function IncidentBrief({ analysis, attackFlow, onShowDetails, onTabChange }) {
  return (
    <article className="bi-card incident-brief-card">
      <div className="panel-heading compact">
        <div>
          <p className="bi-label">Incident Brief</p>
          <h2>{analysis.incident_type}</h2>
        </div>

        <button
          className="ghost-button"
          onClick={() =>
            onShowDetails({
              title: "Incident Summary",
              body: analysis.summary,
            })
          }
        >
          More detail
        </button>
      </div>

      <div className="brief-body">
        <p>{analysis.summary}</p>
      </div>

      <div className="flow-preview-strip">
        {attackFlow?.nodes?.slice(0, 4).map((node, index) => (
          <motion.button
            key={node.id}
            className={`preview-node severity-${node.severity}`}
            whileHover={{ y: -3 }}
            onClick={() => onTabChange("attack-flow")}
          >
            <span>{index + 1}</span>
            <strong>{node.label}</strong>
          </motion.button>
        ))}
      </div>

      <button className="primary-button" onClick={() => onTabChange("attack-flow")}>
        Open interactive flow
      </button>
    </article>
  );
}

export default IncidentBrief;