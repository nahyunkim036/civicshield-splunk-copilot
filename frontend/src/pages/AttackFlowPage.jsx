import AttackFlowCanvas from "../components/flow/AttackFlowCanvas";
import AutoPlaybook from "../components/drill/AutoPlaybook";
import ControlFailureLab from "../components/drill/ControlFailureLab";

function AttackFlowPage({ episodeData, auditData, onAuditRefresh }) {
  const episode = episodeData?.episode;
  const attackMovie = episodeData?.attack_movie;
  const playbook = episodeData?.playbook || [];

  if (!episode || !attackMovie) return null;

  const failureScenarios = [
    {
      id: "no_quarantine",
      question: "No quarantine",
      likely_outcome:
        "The suspicious pod remains active and may continue outbound communication.",
      recommended_control: "Run pod quarantine and apply deny-egress policy.",
    },
    {
      id: "no_network_policy",
      question: "No egress block",
      likely_outcome:
        "The container may keep communicating with an unapproved external IP.",
      recommended_control: "Apply Kubernetes NetworkPolicy to block egress.",
    },
    {
      id: "no_token_rotation",
      question: "No token rotation",
      likely_outcome:
        "A previously accessed service account token may remain usable.",
      recommended_control: "Rotate the affected service account token.",
    },
  ];

  return (
    <section className="attack-movie-page">
      <div className="hero-row compact">
        <div>
          <p className="eyebrow">Attack Movie</p>
          <h1>{attackMovie.title}</h1>
          <p>
            Replay the correlated Splunk episode and execute containment actions
            from the response panel.
          </p>
        </div>

        <div className="mini-stat">
          <span>Audit</span>
          <strong>{auditData?.count || 0}</strong>
        </div>
      </div>

      <div className="movie-grid">
        <AttackFlowCanvas attackMovie={attackMovie} />

        <aside className="side-stack">
          <AutoPlaybook
            steps={playbook}
            episode={episode}
            onActionComplete={onAuditRefresh}
          />

          <ControlFailureLab scenarios={failureScenarios} />
        </aside>
      </div>
    </section>
  );
}

export default AttackFlowPage;