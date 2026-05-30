import IncidentStoryTimeline from "../components/story/IncidentStoryTimeline";
import WhatIfSimulator from "../components/story/WhatIfSimulator";
import ResponseCoach from "../components/story/ResponseCoach";

function StoryModePage({ story }) {
  if (!story) {
    return (
      <section className="story-control-room">
        <div className="story-command-header">
          <p className="section-label">Story Mode</p>
          <h1>Incident Story Simulator</h1>
          <p>Story data is not available yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="story-control-room">
      <div className="story-command-header">
        <div>
          <p className="section-label">Incident Story Simulator</p>
          <h1>{story.story_title}</h1>
          <p>Splunk evidence converted into a replayable incident path.</p>
        </div>

        <div className="outcome-chip">
          <span>Outcome</span>
          <strong>{story.outcome}</strong>
          <p>{story.timeline_count} stages</p>
        </div>
      </div>

      <div className="story-command-grid">
        <IncidentStoryTimeline timeline={story.timeline} />

        <aside className="story-command-side">
          <div className="signal-card">
            <span className="signal-dot" />
            <div>
              <p className="section-label">Live Read</p>
              <h2>{story.outcome}</h2>
              <p>{story.plain_english_summary}</p>
            </div>
          </div>

          <WhatIfSimulator scenarios={story.what_if_scenarios} />
          <ResponseCoach steps={story.response_coach} />
        </aside>
      </div>
    </section>
  );
}

export default StoryModePage;