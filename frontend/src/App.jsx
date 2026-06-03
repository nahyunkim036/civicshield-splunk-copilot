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
  const [story, setStory] = useState(null);
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
        setStory(data.story);
        setLogs(data.logs);
      } catch (err) {
        setError(err.message || "Failed to load CivicShield data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function handleLogSelect(log) {
    setDrawer({
      title: `${log.event_type} · ${log.status}`,
      body: (
        <div className="detail-block">
          <div className="detail-row">
            <span>Timestamp</span>
            <strong>{log.timestamp}</strong>
          </div>

          <div className="detail-row">
            <span>User</span>
            <strong>{log.user}</strong>
          </div>

          <div className="detail-row">
            <span>Source IP</span>
            <strong>{log.src_ip}</strong>
          </div>

          <div className="detail-row">
            <span>Resource</span>
            <strong>{log.resource}</strong>
          </div>

          <div className="detail-row">
            <span>Description</span>
            <p>{log.description}</p>
          </div>

          <pre>{log.raw}</pre>
        </div>
      ),
    });
  }

  if (loading) {
    return (
      <main className="app-shell">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />
        <div className="background-grid" />

        <section className="system-state">
          <p className="eyebrow">CivicShield AI</p>
          <h1>Loading incident drill</h1>
          <p>Connecting Splunk evidence to the drill engine.</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-shell">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />
        <div className="background-grid" />

        <section className="system-state error-state">
          <p className="eyebrow">Connection Error</p>
          <h1>Could not load incident data</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />
      <div className="background-grid" />

      <TopNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "dashboard" && (
        <DashboardPage
          analysis={analysis}
          attackFlow={attackFlow}
          story={story}
          logs={logs}
          onTabChange={setActiveTab}
        />
      )}

      {activeTab === "attack-flow" && (
        <AttackFlowPage
          attackFlow={attackFlow}
          story={story}
          logs={logs}
        />
      )}

      {activeTab === "evidence" && (
        <EvidencePage logs={logs} onLogSelect={handleLogSelect} />
      )}

      <DetailDrawer title={drawer?.title} onClose={() => setDrawer(null)}>
        {drawer?.body}
      </DetailDrawer>
    </main>
  );
}

export default App;