function DetailDrawer({ title, children, onClose }) {
  if (!title) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="detail-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <p className="section-label">More Detail</p>
            <h2>{title}</h2>
          </div>

          <button className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="drawer-content">{children}</div>
      </aside>
    </div>
  );
}

export default DetailDrawer;