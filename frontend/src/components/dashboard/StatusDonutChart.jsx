import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const STATUS_COLORS = {
  failed: "#ef8f8f",
  warning: "#f4b860",
  success: "#7fd1ae",
  blocked: "#4f7cff",
  other: "#b9c3d5",
};

function StatusDonutChart({ logs }) {
  const counts = logs.reduce((acc, log) => {
    const key = log.status || "other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <article className="bi-card chart-card">
      <div className="panel-heading compact">
        <div>
          <p className="bi-label">Status Mix</p>
          <h2>Event Status</h2>
        </div>
        <span className="soft-pill">{logs.length} logs</span>
      </div>

      <div className="donut-chart-layout">
        <div className="chart-box donut-box">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={86}
                paddingAngle={4}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] || STATUS_COLORS.other}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-legend-list">
          {data.map((item) => (
            <div key={item.name}>
              <span
                style={{
                  background: STATUS_COLORS[item.name] || STATUS_COLORS.other,
                }}
              />
              <p>{item.name}</p>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export default StatusDonutChart;