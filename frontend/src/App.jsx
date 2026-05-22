import { useEffect, useState } from "react";
import "./App.css";

import { fetchSecurityBundle } from "./api/splunkApi";
import TopNav from "./components/layout/TopNav";
import DetailDrawer from "./components/shared/DetailDrawer";

import DashboardPage from "./pages/DashboardPage";
import AttackFlowPage from "./pages/AttackFlowPage";
import EvidencePage from "./pages/EvidencePage";

const SELECTED_SCENARIO = "scenario_2";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [analysis, setAnalysis] = useState(null);
  const [attackFlow, setAttackFlow] = useState(null);
  const [logs, setLogs] = useState([]);
  const [drawer, setDrawer] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchSecurityBundle(SELECTED_SCENARIO);

        setAnalysis(data.analysis);
        setAttackFlow(data.attackFlow);
        setLogs(data.logs);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function handleNodeSelect(node) {
    setDrawer({
      title: node.label,
      body: (
        <div className="detail-block">
          <p className="detail-value">{node.value}</p>
          <p>{node.description}</p>
          <span className={`status-badge tone-${node.severity}`}>
            {node.severity}
          </span>
        </div>
      ),
    });
  }

  function handleLogSelect(log) {
    setDrawer({
      title: `${log.event_type} · ${log.status}`,
      body: (
        <div className="detail-block">
          <p><strong>Timestamp:</strong> {log.timestamp}</p>
          <p><strong>User:</strong> {log.user}</p>
          <p><strong>Source IP:</strong> {log.src_ip}</p>
          <p><strong>Resource:</strong> {log.resource}</p>
          <p><strong>Description:</strong> {log.description}</p>
          <pre>{log.raw}</pre>
        </div>
      ),
    });
  }

  if (loading) {
    return (
      <main className="app-shell">
        <div className="loading-glass">Loading CivicShield AI...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-shell">
        <div className="loading-glass error-text">{error}</div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-grid" />

      <TopNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "dashboard" && (
        <DashboardPage
          analysis={analysis}
          attackFlow={attackFlow}
          logs={logs}
          onShowDetails={setDrawer}
          onTabChange={setActiveTab}
        />
      )}

      {activeTab === "attack-flow" && (
        <AttackFlowPage attackFlow={attackFlow} />
      )}

      {activeTab === "evidence" && (
        <EvidencePage logs={logs} onLogSelect={handleLogSelect} />
      )}

      <DetailDrawer
        title={drawer?.title}
        onClose={() => setDrawer(null)}
      >
        {typeof drawer?.body === "string" ? <p>{drawer.body}</p> : drawer?.body}
      </DetailDrawer>
    </main>
  );
}

export default App;