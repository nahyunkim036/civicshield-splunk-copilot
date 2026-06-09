import { useEffect, useState } from "react";
import "./App.css";

import TopNav from "./components/layout/TopNav";
import CaseOverviewPage from "./pages/CaseOverviewPage";
import EvidenceTimelinePage from "./pages/EvidenceTimelinePage";
import ContainmentPage from "./pages/ContainmentPage";
import DetailDrawer from "./components/shared/DetailDrawer";

import {
  fetchResponseAudit,
  fetchSupplyChainEpisode,
} from "./api/splunkApi";

function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [episodeData, setEpisodeData] = useState(null);
  const [auditData, setAuditData] = useState({ count: 0, events: [] });
  const [drawer, setDrawer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadIncidentCase() {
    setLoading(true);
    setError("");

    try {
      const [episodeResponse, auditResponse] = await Promise.all([
        fetchSupplyChainEpisode(),
        fetchResponseAudit(),
      ]);

      setEpisodeData(episodeResponse);
      setAuditData(auditResponse);
    } catch (requestError) {
      setError(requestError.message || "Failed to load incident case.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshAudit() {
    try {
      const auditResponse = await fetchResponseAudit();
      setAuditData(auditResponse);
    } catch (requestError) {
      console.error("Failed to refresh audit trail:", requestError);
    }
  }

  useEffect(() => {
    loadIncidentCase();
  }, []);

  if (loading) {
    return (
      <main className="app-shell">
        <div className="loading-state">
          <p className="eyebrow">Loading Case</p>
          <h1>Building incident case from Splunk evidence</h1>
          <p>
            CivicShield is retrieving supply chain telemetry, reconstructing the
            evidence timeline, and preparing containment actions.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-shell">
        <div className="error-state">
          <p className="eyebrow">Connection Issue</p>
          <h1>Unable to load incident case</h1>
          <p>{error}</p>
          <button type="button" onClick={loadIncidentCase}>
            Retry
          </button>
        </div>
      </main>
    );
  }

  const episode = episodeData?.episode;
  const aiExplanation = episodeData?.ai_explanation;
  const evidenceTimeline = episodeData?.evidence_timeline;
  const playbook = episodeData?.playbook || [];
  const rawEvents = episodeData?.raw_events || [];

  return (
    <main className="app-shell">
      <TopNav activeTab={activeTab} onTabChange={setActiveTab} />

      <section className="workspace">
        {activeTab === "overview" && (
          <CaseOverviewPage
            episodeData={episodeData}
            episode={episode}
            aiExplanation={aiExplanation}
            auditData={auditData}
            onTabChange={setActiveTab}
          />
        )}

        {activeTab === "timeline" && (
          <EvidenceTimelinePage
            episode={episode}
            evidenceTimeline={evidenceTimeline}
            onEvidenceSelect={setDrawer}
          />
        )}

        {activeTab === "containment" && (
          <ContainmentPage
            episodeData={episodeData}
            episode={episode}
            playbook={playbook}
            rawEvents={rawEvents}
            auditData={auditData}
            onAuditRefresh={refreshAudit}
            onLogSelect={setDrawer}
          />
        )}
      </section>

      <DetailDrawer item={drawer} onClose={() => setDrawer(null)} />
    </main>
  );
}

export default App;