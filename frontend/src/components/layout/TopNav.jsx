function TopNav({ activeTab, onTabChange }) {
  const tabs = [
    {
      id: "overview",
      icon: "🔎",
      title: "Case",
      subtitle: "Splunk + AI",
    },
    {
      id: "timeline",
      icon: "🧩",
      title: "Evidence",
      subtitle: "Log replay",
    },
    {
      id: "containment",
      icon: "🛡️",
      title: "Response",
      subtitle: "K8s actions",
    },
  ];

  return (
    <header className="top-nav compact-nav">
      <button
        type="button"
        className="brand compact-brand"
        onClick={() => onTabChange("overview")}
      >
        <span className="brand-mark">CS</span>
        <span className="brand-text">
          <strong>CivicShield</strong>
          <small>Splunk-to-Kubernetes incident workbench</small>
        </span>
      </button>

      <nav className="tabs compact-tabs" aria-label="Main navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab compact-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-copy">
              <strong>{tab.title}</strong>
              <small>{tab.subtitle}</small>
            </span>
          </button>
        ))}
      </nav>
    </header>
  );
}

export default TopNav;