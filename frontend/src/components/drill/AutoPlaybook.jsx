function AutoPlaybook({ steps = [] }) {
  if (!steps.length) {
    return (
      <section className="drill-side-panel">
        <p className="eyebrow">Auto Playbook</p>
        <h2>No playbook</h2>
      </section>
    );
  }

  return (
    <section className="drill-side-panel">
      <p className="eyebrow">Auto Playbook</p>
      <h2>Response stack</h2>

      <div className="auto-playbook-list">
        {steps.slice(0, 5).map((step) => (
          <article key={step.priority}>
            <span>{step.priority}</span>

            <div>
              <strong>{step.action}</strong>
              <p>{step.owner}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AutoPlaybook;