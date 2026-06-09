function renderValue(value) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  if (typeof value === "object") {
    return <pre>{JSON.stringify(value, null, 2)}</pre>;
  }

  return String(value);
}

function DetailDrawer({ drawer, onClose }) {
  if (!drawer) return null;

  const data = drawer.data || {};

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <p className="eyebrow">{drawer.type || "Details"}</p>
            <h2>{drawer.title}</h2>
            {drawer.subtitle && <p>{drawer.subtitle}</p>}
          </div>

          <button type="button" onClick={onClose} aria-label="Close drawer">
            ×
          </button>
        </div>

        <div className="drawer-grid">
          {Object.entries(data).map(([key, value]) => (
            <div className="drawer-field" key={key}>
              <span>{key}</span>
              <strong>{renderValue(value)}</strong>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default DetailDrawer;