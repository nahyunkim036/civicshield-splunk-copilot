import { useMemo, useState } from "react";

function ModalRow({ label, value }) {
    return (
        <div className="modal-row">
            <span>{label}</span>
            <strong>{value || "--"}</strong>
        </div>
    );
}

function SignalPill({ signal }) {
    return <span className="signal-pill">{signal}</span>;
}

function PopModal({ modal, onClose }) {
    if (!modal) return null;

    return (
        <div className="pop-backdrop" onClick={onClose}>
            <section
                className={`pop-card ${modal.tone || ""}`}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="pop-header">
                    <div>
                        <p className="eyebrow">{modal.eyebrow}</p>
                        <h2>{modal.title}</h2>
                    </div>

                    <button type="button" onClick={onClose} aria-label="Close modal">
                        ×
                    </button>
                </div>

                <div className="pop-body">{modal.content}</div>
            </section>
        </div>
    );
}

function CaseOverviewPage({
    episodeData,
    episode,
    aiExplanation,
    auditData,
    evidenceTimeline,
    onTabChange,
    onOpenDrawer,
}) {
    const [modalKey, setModalKey] = useState(null);

    const stages = evidenceTimeline?.stages || [];
    const visibleStages = stages.slice(0, 5);
    const eventCount = episodeData?.total_events_analyzed || episode?.event_count || 0;
    const sourceIndex = episodeData?.index || "civic_supply_chain_logs";

    const modals = useMemo(
        () => ({
            logs: {
                eyebrow: "📜 Splunk Logs",
                title: "What Splunk analyzed",
                tone: "blue",
                content: (
                    <>
                        <p className="modal-copy">
                            Splunk is the evidence source. The backend queries the indexed
                            supply-chain events and converts them into a case, timeline, and
                            response playbook.
                        </p>

                        <div className="modal-grid">
                            <ModalRow label="Index" value={sourceIndex} />
                            <ModalRow label="Events analyzed" value={eventCount} />
                            <ModalRow label="Source" value={episodeData?.source || "splunk"} />
                            <ModalRow label="Case" value={episode?.episode_title} />
                        </div>
                    </>
                ),
            },

            signals: {
                eyebrow: "🧪 Splunk Analysis",
                title: "How the evidence was grouped",
                tone: "yellow",
                content: (
                    <>
                        <p className="modal-copy">
                            CivicShield groups Splunk events into security signals such as
                            package entry, credential access, external connection, privilege
                            escalation, and containment.
                        </p>

                        <div className="signal-cloud">
                            {(episode?.risk_signals || []).map((signal) => (
                                <SignalPill key={signal} signal={signal} />
                            ))}
                        </div>

                        <div className="modal-grid">
                            <ModalRow label="Risk level" value={episode?.risk_level} />
                            <ModalRow
                                label="Risk score"
                                value={`${episode?.risk_score ?? "--"}/100`}
                            />
                            <ModalRow label="Pod" value={episode?.pod} />
                            <ModalRow label="Package" value={episode?.package} />
                        </div>
                    </>
                ),
            },

            ai: {
                eyebrow: "🧠 AI Summary",
                title: "Readable case explanation",
                tone: "green",
                content: (
                    <>
                        <p className="modal-copy large">
                            {aiExplanation?.case_summary ||
                                "CivicShield analyzed Splunk evidence and built an incident case."}
                        </p>

                        <div className="modal-note">
                            {aiExplanation?.why_it_matters ||
                                "Multiple suspicious runtime events were correlated from Splunk logs."}
                        </div>

                        <p className="modal-copy">
                            {aiExplanation?.recommended_response ||
                                "Review the evidence timeline and run containment actions if needed."}
                        </p>

                        <div className="modal-grid">
                            <ModalRow
                                label="Confidence"
                                value={aiExplanation?.confidence || "Medium"}
                            />
                            <ModalRow label="Containment" value={episode?.containment} />
                        </div>
                    </>
                ),
            },

            response: {
                eyebrow: "🛡️ Response",
                title: "What the user can do next",
                tone: "red",
                content: (
                    <>
                        <p className="modal-copy">
                            After reviewing the evidence, the user can run containment
                            actions. In Kubernetes mode, CivicShield can quarantine the
                            affected Pod and apply a deny-egress NetworkPolicy.
                        </p>

                        <div className="modal-grid">
                            <ModalRow label="Target pod" value={episode?.pod} />
                            <ModalRow label="Namespace" value={episode?.namespace} />
                            <ModalRow label="Audit actions" value={auditData?.count || 0} />
                            <ModalRow label="Status" value={episode?.containment} />
                        </div>

                        <button
                            type="button"
                            className="modal-action"
                            onClick={() => onTabChange("containment")}
                        >
                            Open response workspace
                        </button>
                    </>
                ),
            },
        }),
        [
            episodeData,
            episode,
            aiExplanation,
            auditData,
            eventCount,
            sourceIndex,
            onTabChange,
        ]
    );

    return (
        <div className="case-page compact-page">
            <section className="page-title-row clean-title-row">
                <div>
                    <p className="eyebrow">🔎 Case Overview</p>
                    <h1>{episode?.episode_title || "Supply Chain Incident Case"}</h1>
                    <p>
                        Splunk analyzed {eventCount || "the"} events and grouped them into
                        one incident.
                    </p>
                </div>

                <div className="page-actions">
                    <button
                        type="button"
                        className="primary-action"
                        onClick={() => onTabChange("timeline")}
                    >
                        View Evidence
                    </button>
                    <button
                        type="button"
                        className="secondary-action"
                        onClick={() => setModalKey("ai")}
                    >
                        AI Summary
                    </button>
                    <button
                        type="button"
                        className="secondary-action"
                        onClick={() => onTabChange("containment")}
                    >
                        Run Response
                    </button>
                </div>
            </section>

            <section className="case-console">
                <article className="case-console-main">
                    <div className="case-console-top">
                        <div>
                            <span className="mini-label">Incident</span>
                            <h2>Analyzed supply-chain behavior</h2>
                        </div>

                        <button
                            type="button"
                            className={`risk-pill ${String(
                                episode?.risk_level || ""
                            ).toLowerCase()}`}
                            onClick={() => setModalKey("signals")}
                        >
                            {episode?.risk_level || "Unknown"} risk
                        </button>
                    </div>

                    <div className="asset-line">
                        <button
                            type="button"
                            onClick={() =>
                                onOpenDrawer({
                                    type: "Affected asset",
                                    title: episode?.pod,
                                    subtitle: "Kubernetes pod",
                                    data: episode,
                                })
                            }
                        >
                            <span>Pod</span>
                            <strong>{episode?.pod || "unknown"}</strong>
                        </button>

                        <button type="button">
                            <span>Namespace</span>
                            <strong>{episode?.namespace || "unknown"}</strong>
                        </button>

                        <button type="button" onClick={() => setModalKey("signals")}>
                            <span>Package</span>
                            <strong>{episode?.package || "unknown"}</strong>
                        </button>

                        <button type="button" onClick={() => setModalKey("logs")}>
                            <span>Events</span>
                            <strong>{eventCount}</strong>
                        </button>
                    </div>
                    <div className="ai-insight-line">
                        <span>AI insight</span>
                        <p>
                            {aiExplanation?.case_summary ||
                                "AI explanation will appear after Splunk evidence is analyzed."}
                        </p>
                    </div>

                    <div className="analysis-stepper">
                        <button type="button" onClick={() => setModalKey("logs")}>
                            <span>📜</span>
                            <strong>Logs</strong>
                            <small>Splunk index</small>
                        </button>

                        <i />

                        <button type="button" onClick={() => setModalKey("signals")}>
                            <span>🧪</span>
                            <strong>Analysis</strong>
                            <small>Signals</small>
                        </button>

                        <i />

                        <button type="button" onClick={() => setModalKey("ai")}>
                            <span>🧠</span>
                            <strong>AI Summary</strong>
                            <small>Readable</small>
                        </button>

                        <i />

                        <button type="button" onClick={() => setModalKey("response")}>
                            <span>🛡️</span>
                            <strong>Response</strong>
                            <small>Kubernetes</small>
                        </button>
                    </div>
                </article>
            </section>

            <section className="evidence-strip-section">
                <div className="section-mini-head clean">
                    <div>
                        <p className="eyebrow">🧩 Evidence Preview</p>
                        <h2>Log path</h2>
                    </div>

                    <button type="button" onClick={() => onTabChange("timeline")}>
                        Open timeline
                    </button>
                </div>

                <div className="evidence-strip">
                    {visibleStages.map((stage) => (
                        <button
                            key={stage.id}
                            type="button"
                            className={`evidence-strip-item severity-${stage.severity || "medium"
                                }`}
                            onClick={() =>
                                onOpenDrawer({
                                    type: "Splunk evidence",
                                    title: stage.stage,
                                    subtitle: stage.headline,
                                    data: stage,
                                })
                            }
                        >
                            <span>{String(stage.step).padStart(2, "0")}</span>
                            <div>
                                <strong>{stage.stage}</strong>
                                <small>{stage.headline}</small>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            <PopModal modal={modals[modalKey]} onClose={() => setModalKey(null)} />
        </div>
    );
}

export default CaseOverviewPage;