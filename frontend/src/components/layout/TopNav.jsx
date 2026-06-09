function TopNav({ activeTab, onTabChange }) {
  const tabs = [
    {
      id: "overview",
      label: "Case Overview",
      description: "Incident summary",
    },
    {
      id: "timeline",
      label: "Evidence Timeline",
      description: "Splunk evidence replay",
    },
    {
      id: "containment",
      label: "Containment",
      description: "Response actions",
    },
  ];

  return (
    <header className="top-nav">
      <div className="brand-block">
        <div className="brand-mark">CS</div>
        <div>
          <h1>CivicShield AI</h1>
          <p>Splunk-to-Kubernetes Incident Response Workbench</p>
        </div>
      </div>

      <nav className="tab-nav" aria-label="Main navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <span>{tab.label}</span>
            <small>{tab.description}</small>
          </button>
        ))}
      </nav>
    </header>
  );
}

export default TopNav;