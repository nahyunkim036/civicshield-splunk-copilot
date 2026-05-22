import { motion } from "framer-motion";

function MetricCard({ label, value, subtext, tone = "blue", icon }) {
  return (
    <motion.article
      className={`bi-card metric-card-bi tone-${tone}`}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="metric-card-top">
        <span className="metric-icon">{icon}</span>
        <span className={`metric-dot dot-${tone}`} />
      </div>

      <p className="bi-label">{label}</p>
      <strong>{value}</strong>
      <span>{subtext}</span>
    </motion.article>
  );
}

export default MetricCard;