import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatTimeLabel(timestamp) {
  if (!timestamp) return "unknown";
  const parts = timestamp.split(" ");
  return parts[1] || timestamp;
}

function EventTimelineChart({ logs }) {
  const grouped = logs.reduce((acc, log) => {
    const label = formatTimeLabel(log.timestamp);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(grouped).map(([time, count]) => ({
    time,
    count,
  }));

  return (
    <article className="bi-card chart-card wide-chart">
      <div className="panel-heading compact">
        <div>
          <p className="bi-label">Timeline</p>
          <h2>Event Burst Pattern</h2>
        </div>
        <span className="soft-pill">Splunk timeline</span>
      </div>

      <div className="chart-box">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f7cff" stopOpacity={0.34} />
                <stop offset="95%" stopColor="#4f7cff" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.18)" />
            <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#4f7cff"
              strokeWidth={3}
              fill="url(#eventGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default EventTimelineChart;