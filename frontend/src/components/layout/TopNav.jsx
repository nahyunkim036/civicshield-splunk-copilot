function TopNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: "dashboard", label: "Command Center" },
    { id: "attack-flow", label: "Attack Movie" },
    { id: "evidence", label: "Evidence" },
  ];

  return (
    <header className="top-nav">
      <div className="brand-area">
        <div className="brand-logo">C</div>

        <div>
          <h1>CivicShield AI</h1>
          <p>Autonomous Incident Drill Agent</p>
        </div>
      </div>

      <nav className="tab-switcher" aria-label="Primary navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "tab active" : "tab"}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="connection-pill">
        <span />
        Splunk Live
      </div>
    </header>
  );
}

export default TopNav;