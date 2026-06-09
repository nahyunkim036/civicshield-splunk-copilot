function TopNav({ activeTab, onTabChange }) {
  const tabs = [
    {
      id: "overview",
      title: "Case",
      subtitle: "Splunk + AI",
    },
    {
      id: "timeline",
      title: "Evidence",
      subtitle: "Log replay",
    },
    {
      id: "containment",
      title: "Response",
      subtitle: "Kubernetes",
    },
  ];

  return (
    <header className="top-nav">
      <button
        type="button"
        className="brand"
        onClick={() => onTabChange("overview")}
      >
        <span className="brand-mark">CS</span>
        <span>
          <strong>CivicShield</strong>
          <small>Splunk-to-Kubernetes response workbench</small>
        </span>
      </button>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            <strong>{tab.title}</strong>
            <small>{tab.subtitle}</small>
          </button>
        ))}
      </nav>
    </header>
  );
}

export default TopNav;