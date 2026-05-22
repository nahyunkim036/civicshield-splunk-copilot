import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function EventTypeBarChart({ logs }) {
  const counts = logs.reduce((acc, log) => {
    const key = log.event_type || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([type, count]) => ({
    type,
    count,
  }));

  return (
    <article className="bi-card chart-card">
      <div className="panel-heading compact">
        <div>
          <p className="bi-label">Breakdown</p>
          <h2>Event Types</h2>
        </div>
      </div>

      <div className="chart-box">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.18)" />
            <XAxis dataKey="type" tick={{ fill: "#64748b", fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#7c6cff" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default EventTypeBarChart;