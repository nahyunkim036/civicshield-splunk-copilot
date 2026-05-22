import { motion } from "framer-motion";

function getRiskScore(riskLevel) {
  if (riskLevel === "High") return 86;
  if (riskLevel === "Medium") return 62;
  if (riskLevel === "Low") return 28;
  return 15;
}

function getRiskTone(riskLevel) {
  if (riskLevel === "High") return "danger";
  if (riskLevel === "Medium") return "warning";
  if (riskLevel === "Low") return "success";
  return "blue";
}

function RiskGauge({ riskLevel, incidentType, confidence }) {
  const score = getRiskScore(riskLevel);
  const tone = getRiskTone(riskLevel);

  return (
    <article className="bi-card risk-gauge-card">
      <div className="panel-heading compact">
        <div>
          <p className="bi-label">Risk Score</p>
          <h2>{riskLevel} Risk</h2>
        </div>
        <span className={`status-badge tone-${tone}`}>{confidence}</span>
      </div>

      <div className="gauge-wrap">
        <div
          className="gauge-ring"
          style={{
            background: `conic-gradient(var(--${tone}) ${score * 3.6}deg, rgba(148,163,184,0.16) 0deg)`,
          }}
        >
          <motion.div
            className="gauge-inner"
            initial={{ scale: 0.86, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45 }}
          >
            <strong>{score}</strong>
            <span>/ 100</span>
          </motion.div>
        </div>
      </div>

      <p className="risk-caption">{incidentType}</p>
    </article>
  );
}

export default RiskGauge;