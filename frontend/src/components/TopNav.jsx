function TopNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "attack-flow", label: "Attack Flow" },
    { id: "evidence", label: "Evidence" },
  ];

  return (
    <header className="top-nav">
      <div className="brand-area">
        <div className="brand-logo">C</div>
        <div>
          <h1>CivicShield AI</h1>
          <p>Splunk-powered security copilot</p>
        </div>
      </div>

      <nav className="tab-switcher">
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
        Backend Connected
      </div>
    </header>
  );
}

export default TopNav;