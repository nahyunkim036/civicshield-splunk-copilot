import { useEffect, useMemo, useState } from "react";
import {
  fetchResponseAudit,
  fetchSupplyChainEpisode,
} from "./api/splunkApi";
import TopNav from "./components/layout/TopNav";
import DetailDrawer from "./components/shared/DetailDrawer";
import CaseOverviewPage from "./pages/CaseOverviewPage";
import EvidenceTimelinePage from "./pages/EvidenceTimelinePage";
import ContainmentPage from "./pages/ContainmentPage";
import "./App.css";

function normalizeEvidenceTimeline(episodeData) {
  if (episodeData?.evidence_timeline?.stages) {
    return episodeData.evidence_timeline;
  }

  if (episodeData?.attack_movie?.nodes) {
    return {
      stages: episodeData.attack_movie.nodes.map((node, index) => ({
        id: node.id || `stage-${index + 1}`,
        step: node.step || index + 1,
        time: node.time || node.timestamp || "--",
        stage: node.stage || node.label || `Stage ${index + 1}`,
        headline: node.headline || node.description || node.label,
        description: node.description || node.headline || "",
        event_type: node.event_type,
        risk_signal: node.risk_signal,
        severity: node.severity || "medium",
        status: node.status,
        evidence: node.evidence || {},
      })),
    };
  }

  if (episodeData?.raw_events) {
    return {
      stages: episodeData.raw_events.map((event, index) => ({
        id: `stage-${index + 1}`,
        step: index + 1,
        time: event.timestamp || "--",
        stage: event.kill_chain_stage || event.event_type || `Stage ${index + 1}`,
        headline: event.description || event.event_type,
        description: event.description || "",
        event_type: event.event_type,
        risk_signal: event.risk_signal,
        severity: event.severity || "medium",
        status: event.status,
        evidence: event,
      })),
    };
  }

  return { stages: [] };
}

function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [episodeData, setEpisodeData] = useState(null);
  const [auditData, setAuditData] = useState({ count: 0, events: [] });
  const [drawer, setDrawer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const episode = episodeData?.episode || {};
  const aiExplanation = episodeData?.ai_explanation || {};
  const evidenceTimeline = useMemo(
    () => normalizeEvidenceTimeline(episodeData),
    [episodeData]
  );

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [episodeResponse, auditResponse] = await Promise.all([
        fetchSupplyChainEpisode(),
        fetchResponseAudit(),
      ]);

      setEpisodeData(episodeResponse);
      setAuditData(auditResponse);
    } catch (requestError) {
      setError(requestError.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshAudit() {
    const auditResponse = await fetchResponseAudit();
    setAuditData(auditResponse);
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-card">
          <p className="eyebrow">CivicShield</p>
          <h1>Loading Splunk evidence</h1>
          <p>Connecting to backend and rebuilding the incident case.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="loading-screen">
        <div className="loading-card error">
          <p className="eyebrow">Error</p>
          <h1>Could not load the case</h1>
          <p>{error}</p>
          <button type="button" onClick={loadData}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <TopNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="workspace">
        {activeTab === "overview" && (
          <CaseOverviewPage
            episodeData={episodeData}
            episode={episode}
            aiExplanation={aiExplanation}
            auditData={auditData}
            evidenceTimeline={evidenceTimeline}
            onTabChange={setActiveTab}
            onOpenDrawer={setDrawer}
          />
        )}

        {activeTab === "timeline" && (
          <EvidenceTimelinePage
            episode={episode}
            evidenceTimeline={evidenceTimeline}
            onOpenDrawer={setDrawer}
          />
        )}

        {activeTab === "containment" && (
          <ContainmentPage
            episode={episode}
            playbook={episodeData?.playbook || []}
            rawEvents={episodeData?.raw_events || []}
            auditData={auditData}
            onAuditRefresh={refreshAudit}
            onLogSelect={setDrawer}
          />
        )}
      </main>

      <DetailDrawer drawer={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}

export default App;