function FlowLegend() {
  return (
    <div className="flow-legend">
      <div>
        <span className="legend-dot medium-dot" />
        Medium signal
      </div>
      <div>
        <span className="legend-dot warning-dot" />
        Suspicious activity
      </div>
      <div>
        <span className="legend-dot danger-dot" />
        High-risk step
      </div>
      <div>
        <span className="legend-dot resolved-dot" />
        Contained or blocked
      </div>
    </div>
  );
}

export default FlowLegend;