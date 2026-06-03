import { useEffect, useState } from "react";
import "./App.css";

import {
  fetchResponseAudit,
  fetchSupplyChainEpisode,
} from "./api/splunkApi";

import TopNav from "./components/layout/TopNav";
import DetailDrawer from "./components/shared/DetailDrawer";

import DashboardPage from "./pages/DashboardPage";
import AttackFlowPage from "./pages/AttackFlowPage";
import EvidencePage from "./pages/EvidencePage";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [episodeData, setEpisodeData] = useState(null);
  const [auditData, setAuditData] = useState({ count: 0, events: [] });

  const [drawer, setDrawer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refreshAudit() {
    try {
      const audit = await fetchResponseAudit();
      setAuditData(audit);
    } catch (err) {
      console.error("Failed to refresh audit log:", err);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const supplyChainEpisode = await fetchSupplyChainEpisode();
        const audit = await fetchResponseAudit();

        setEpisodeData(supplyChainEpisode);
        setAuditData(audit);
      } catch (err) {
        setError(err.message || "Failed to load supply chain episode.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function handleLogSelect(log) {
    setDrawer({
      title: `${log.event_type} · ${log.severity}`,
      body: (
        <div className="detail-block">
          <div className="detail-row">
            <span>Timestamp</span>
            <strong>{log.timestamp}</strong>
          </div>

          <div className="detail-row">
            <span>Pod</span>
            <strong>{log.pod}</strong>
          </div>

          <div className="detail-row">
            <span>Package</span>
            <strong>{log.package}</strong>
          </div>

          <div className="detail-row">
            <span>Event Type</span>
            <strong>{log.event_type}</strong>
          </div>

          <div className="detail-row">
            <span>Status</span>
            <strong>{log.status}</strong>
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
        <section className="system-state">
          <p className="eyebrow">CivicShield AI</p>
          <h1>Loading Supply Chain Episode</h1>
          <p>Reading Splunk telemetry and building the response pipeline.</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-shell">
        <section className="system-state error-state">
          <p className="eyebrow">Connection Error</p>
          <h1>Episode unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <TopNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "dashboard" && (
        <DashboardPage
          episodeData={episodeData}
          auditData={auditData}
          onTabChange={setActiveTab}
        />
      )}

      {activeTab === "attack-flow" && (
        <AttackFlowPage
          episodeData={episodeData}
          auditData={auditData}
          onAuditRefresh={refreshAudit}
        />
      )}

      {activeTab === "evidence" && (
        <EvidencePage
          logs={episodeData?.raw_events || []}
          auditData={auditData}
          onLogSelect={handleLogSelect}
        />
      )}

      <DetailDrawer title={drawer?.title} onClose={() => setDrawer(null)}>
        {drawer?.body}
      </DetailDrawer>
    </main>
  );
}

export default App;