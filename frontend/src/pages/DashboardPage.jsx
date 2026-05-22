import {
  Activity,
  Database,
  ShieldAlert,
  Target,
} from "lucide-react";

import MetricCard from "../components/dashboard/MetricCard";
import RiskGauge from "../components/dashboard/RiskGauge";
import StatusDonutChart from "../components/dashboard/StatusDonutChart";
import EventTimelineChart from "../components/dashboard/EventTimelineChart";
import EventTypeBarChart from "../components/dashboard/EventTypeBarChart";
import IncidentBrief from "../components/dashboard/IncidentBrief";

function DashboardPage({ analysis, attackFlow, logs, onShowDetails, onTabChange }) {
  if (!analysis) return null;

  const threatPersona = analysis.threat_persona || {};
  const sourceIp = logs.find((log) => log.src_ip)?.src_ip || "Unknown";
  const blockedCount = logs.filter((log) => log.status === "blocked").length;

  return (
    <div className="dashboard-bi-layout">
      <section className="dashboard-hero">
        <div>
          <p className="section-label">Security BI Overview</p>
          <h1>CivicShield Command Center</h1>
          <p>
            Splunk evidence transformed into incident metrics, visual patterns,
            and an interactive security story.
          </p>
        </div>

        <div className="hero-scenario-card">
          <span>Current Scenario</span>
          <strong>Blocked Brute Force</strong>
          <p>scenario_2</p>
        </div>
      </section>

      <section className="metric-grid bi-metric-grid">
        <MetricCard
          label="Events"
          value={analysis.total_events_analyzed}
          subtext="Logs analyzed from Splunk"
          tone="blue"
          icon={<Database size={20} />}
        />

        <MetricCard
          label="Evidence"
          value={analysis.evidence_count}
          subtext="Signals used for detection"
          tone="purple"
          icon={<Target size={20} />}
        />

        <MetricCard
          label="Source IP"
          value={sourceIp}
          subtext="Primary suspicious source"
          tone="warning"
          icon={<Activity size={20} />}
        />

        <MetricCard
          label="Blocked"
          value={blockedCount}
          subtext="Containment events"
          tone="success"
          icon={<ShieldAlert size={20} />}
        />
      </section>

      <section className="bi-dashboard-grid">
        <RiskGauge
          riskLevel={analysis.risk_level}
          incidentType={analysis.incident_type}
          confidence={analysis.confidence}
        />

        <IncidentBrief
          analysis={analysis}
          attackFlow={attackFlow}
          onShowDetails={onShowDetails}
          onTabChange={onTabChange}
        />

        <article className="bi-card threat-card-bi">
          <p className="bi-label">Threat Persona</p>
          <div className="threat-avatar">⚡</div>
          <h2>{threatPersona.name || "Unknown"}</h2>
          <p>{threatPersona.behavior || "No behavior classified yet."}</p>

          <button
            className="ghost-button"
            onClick={() =>
              onShowDetails({
                title: threatPersona.name || "Threat Persona",
                body: threatPersona.intent || "No intent available.",
              })
            }
          >
            View intent
          </button>
        </article>

        <EventTimelineChart logs={logs} />
        <StatusDonutChart logs={logs} />
        <EventTypeBarChart logs={logs} />
      </section>
    </div>
  );
}

export default DashboardPage;