import AttackFlowCanvas from "../components/flow/AttackFlowCanvas";
import ControlFailureLab from "../components/drill/ControlFailureLab";
import AutoPlaybook from "../components/drill/AutoPlaybook";

function AttackFlowPage({ attackFlow, story, logs }) {
  return (
    <section className="attack-movie-page">
      <div className="movie-header">
        <div>
          <p className="eyebrow">Attack Movie</p>
          <h1>{story?.story_title || attackFlow?.flow_title || "Incident Replay"}</h1>
          <p>
            Watch the attack path unfold from Splunk evidence. No report reading.
            Just replay, inspect, and respond.
          </p>
        </div>

        <div className="movie-stat">
          <span>Evidence</span>
          <strong>{logs.length}</strong>
          <p>Splunk events</p>
        </div>
      </div>

      <div className="movie-layout">
        <AttackFlowCanvas attackFlow={attackFlow} story={story} />

        <aside className="movie-side-stack">
          <ControlFailureLab scenarios={story?.what_if_scenarios || []} />
          <AutoPlaybook steps={story?.response_coach || []} />
        </aside>
      </div>
    </section>
  );
}

export default AttackFlowPage;