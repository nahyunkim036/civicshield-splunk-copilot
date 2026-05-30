import IncidentStoryTimeline from "../components/story/IncidentStoryTimeline";
import WhatIfSimulator from "../components/story/WhatIfSimulator";
import ResponseCoach from "../components/story/ResponseCoach";

function StoryModePage({ story }) {
  if (!story) {
    return (
      <section className="story-page-layout">
        <div className="story-hero">
          <p className="section-label">Story Mode</p>
          <h1>Incident Story Simulator</h1>
          <p>Story data is not available yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="story-page-layout">
      <div className="story-hero">
        <div>
          <p className="section-label">Incident Story Simulator</p>
          <h1>{story.story_title}</h1>
          <p>{story.plain_english_summary}</p>
        </div>

        <div className="story-outcome">
          <span>Outcome</span>
          <strong>{story.outcome}</strong>
          <p>{story.timeline_count} story stages</p>
        </div>
      </div>

      <div className="story-grid">
        <IncidentStoryTimeline timeline={story.timeline} />

        <div className="story-side-stack">
          <WhatIfSimulator scenarios={story.what_if_scenarios} />
          <ResponseCoach steps={story.response_coach} />
        </div>
      </div>
    </section>
  );
}

export default StoryModePage;