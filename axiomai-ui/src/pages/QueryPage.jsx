import React, { useState } from 'react';
import { useQuerySession } from '../context/QuerySessionContext';
import '../components/components.css';

const PIPELINE_STAGES = [
    { id: 'retrieving', label: 'RETRIEVE', code: '01', desc: 'Semantic vector search in Pinecone', icon: '⟐' },
    { id: 'generating', label: 'GENERATE', code: '02', desc: 'LLM inference via Gemini', icon: '⟡' },
    { id: 'validating', label: 'VALIDATE', code: '03', desc: 'Trust Score computation', icon: '⊘' },
    { id: 'verifying', label: 'VERIFY', code: '04', desc: 'Claim-level hallucination check', icon: '⊛' },
    { id: 'refreshing', label: 'REFRESH', code: '05', desc: 'Knowledge self-healing loop', icon: '⟳' },
];

function getStageStatus(stageId, stageIndex, phase) {
    if (phase === 'idle') return 'pending';
    if (phase === 'done') return 'completed';
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === phase);
    if (currentIndex === -1) return 'pending';
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
}

function getStatusColor(status) {
    switch (status) {
        case 'trusted': return 'var(--status-trusted)';
        case 'hallucinated': return 'var(--status-risk)';
        case 'low_confidence': return '#F59E0B';
        case 'refusal': return '#F97316';
        default: return 'var(--text-muted)';
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'trusted': return 'TRUSTED';
        case 'hallucinated': return 'HALLUCINATED';
        case 'low_confidence': return 'LOW CONFIDENCE';
        case 'refusal': return 'OUT OF SCOPE';
        default: return 'PENDING';
    }
}

const QueryPage = () => {
    const { state, handleQuerySubmit } = useQuerySession();
    const [query, setQuery] = useState('');
    const [showEvidence, setShowEvidence] = useState(false);

    const onSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            handleQuerySubmit(query.trim());
        }
    };

    const isProcessing = state.phase !== 'idle' && state.phase !== 'done';
    const hasResult = state.phase === 'done' && state.answer && !state.error;
    const showPipeline = isProcessing || hasResult;

    return (
        <div className="query-page">
            {/* ─── QUERY INPUT (FULL WIDTH TOP) ─── */}
            <section className="qp-input-section">
                <div className="qp-input-header mono">
                    <span style={{ color: 'var(--color-trust)' }}>QUERY_INTERFACE</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {isProcessing ? '⟳ PROCESSING...' : state.phase === 'done' ? '✓ COMPLETE' : '◯ READY'}
                    </span>
                </div>
                <form onSubmit={onSubmit} className="qp-form">
                    <input
                        type="text"
                        className="qp-input mono"
                        placeholder="Enter your query..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={isProcessing}
                    />
                    <button type="submit" className="qp-submit mono" disabled={isProcessing || !query.trim()}>
                        {isProcessing ? 'RUNNING...' : 'EXECUTE'}
                    </button>
                </form>
            </section>

            {/* ─── ERROR DISPLAY ─── */}
            {state.error && (
                <section className="qp-error-section glass-panel">
                    <span className="mono" style={{ color: 'var(--status-risk)' }}>
                        [ERROR] {state.error}
                    </span>
                </section>
            )}

            {/* ─── TWO-COLUMN: PIPELINE LEFT | RESULTS RIGHT ─── */}
            {showPipeline && (
                <div className="qp-split-layout">
                    {/* LEFT: Pipeline Tracker */}
                    <aside className="qp-pipeline-panel">
                        <div className="qp-section-label mono">
                            <span>PIPELINE_TRACE</span>
                            <span style={{ color: isProcessing ? 'var(--color-trust)' : 'var(--status-trusted)' }}>
                                {isProcessing ? 'ACTIVE' : 'DONE'}
                            </span>
                        </div>
                        <div className="qp-pipeline-grid">
                            {PIPELINE_STAGES.map((stage, index) => {
                                const status = getStageStatus(stage.id, index, state.phase);
                                return (
                                    <div key={stage.id} className={`qp-stage qp-stage--${status}`}>
                                        <div className="qp-stage-indicator">
                                            <div className={`qp-stage-dot qp-stage-dot--${status}`}>
                                                {status === 'completed' && <span>✓</span>}
                                                {status === 'active' && <span className="qp-pulse">{stage.icon}</span>}
                                                {status === 'pending' && <span style={{ opacity: 0.3 }}>{stage.code}</span>}
                                            </div>
                                            {index < PIPELINE_STAGES.length - 1 && (
                                                <div className={`qp-connector qp-connector--${status === 'completed' ? 'done' : 'pending'}`} />
                                            )}
                                        </div>
                                        <div className="qp-stage-info">
                                            <div className="qp-stage-label mono">[{stage.code}] {stage.label}</div>
                                            <div className="qp-stage-desc">{stage.desc}</div>
                                            <div className={`qp-stage-status mono qp-status-text--${status}`}>
                                                {status === 'completed' ? 'DONE' : status === 'active' ? 'RUNNING' : 'WAITING'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* System Log (under pipeline) */}
                        {state.reasoningLog && state.reasoningLog.length > 0 && (
                            <div className="qp-log-section" style={{ marginTop: '1.5rem' }}>
                                <div className="qp-section-label mono" style={{ marginBottom: '0.75rem' }}>
                                    <span>SYSTEM_LOG</span>
                                </div>
                                <div className="qp-log-content mono">
                                    {state.reasoningLog.map((log, idx) => (
                                        <div key={idx} className="qp-log-entry">
                                            <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                                                {String(idx).padStart(2, '0')}
                                            </span>
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* RIGHT: Results Panel */}
                    <main className="qp-results-panel">
                        {/* Show waiting state while processing */}
                        {isProcessing && !hasResult && (
                            <div className="qp-waiting">
                                <div className="qp-waiting-icon">⟳</div>
                                <div className="mono" style={{ color: 'var(--text-muted)' }}>
                                    Pipeline processing...
                                </div>
                            </div>
                        )}

                        {/* Show result when done */}
                        {hasResult && (
                            <div className="qp-result-section">
                                {/* Trust Score Header */}
                                <div className="qp-result-header">
                                    <div className="qp-result-meta">
                                        <span className="qp-result-title mono">SYSTEM_RESPONSE</span>
                                        <span className="mono" style={{ color: getStatusColor(state.status), fontSize: '0.85rem' }}>
                                            STATUS: {getStatusLabel(state.status)}
                                        </span>
                                    </div>
                                    <div className="qp-trust-badge" style={{ borderColor: getStatusColor(state.status || 'trusted') }}>
                                        <div className="qp-trust-label mono">AXIOM_SCORE</div>
                                        <div className="qp-trust-value mono" style={{ color: getStatusColor(state.status || 'trusted') }}>
                                            {(state.trustScore || 0).toFixed(3)}
                                        </div>
                                    </div>
                                </div>

                                {/* Answer Body */}
                                <div className="qp-answer-body">
                                    <p>{state.answer}</p>
                                </div>

                                {/* Claim Verification */}
                                {state.claims && state.claims.length > 0 && (
                                    <div className="qp-claims-section">
                                        <div className="qp-section-label mono" style={{ marginBottom: '1rem' }}>
                                            <span>CLAIM_VERIFICATION</span>
                                            <span style={{ color: 'var(--text-muted)' }}>{state.claims.length} CLAIMS</span>
                                        </div>
                                        {state.claims.map((claim, idx) => (
                                            <div
                                                key={idx}
                                                className="qp-claim"
                                                style={{
                                                    borderLeftColor:
                                                        claim.status === 'supported' ? 'var(--status-trusted)' :
                                                            claim.status === 'hallucinated' ? 'var(--status-risk)' :
                                                                'var(--status-warning)'
                                                }}
                                            >
                                                <div className="qp-claim-header mono">
                                                    <span style={{
                                                        color:
                                                            claim.status === 'supported' ? 'var(--status-trusted)' :
                                                                claim.status === 'hallucinated' ? 'var(--status-risk)' :
                                                                    'var(--status-warning)'
                                                    }}>
                                                        {claim.status === 'supported' ? '✓ VERIFIED' :
                                                            claim.status === 'hallucinated' ? '✗ UNSUPPORTED' :
                                                                '⚠ LOW_CONFIDENCE'}
                                                    </span>
                                                    {claim.evidence_count !== undefined && (
                                                        <span style={{ color: 'var(--text-muted)' }}>{claim.evidence_count} sources</span>
                                                    )}
                                                </div>
                                                <div className="qp-claim-text">{claim.text}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Evidence & Citations (Bottom of results) */}
                                {state.citations && state.citations.length > 0 && (
                                    <div className="qp-evidence-section">
                                        <div
                                            className="qp-section-label mono qp-evidence-toggle"
                                            onClick={() => setShowEvidence(!showEvidence)}
                                            style={{ cursor: 'pointer', marginBottom: showEvidence ? '1rem' : 0 }}
                                        >
                                            <span>EVIDENCE_CITATIONS</span>
                                            <span style={{ color: 'var(--color-trust)' }}>
                                                {state.citations.length} SOURCES {showEvidence ? '▲' : '▼'}
                                            </span>
                                        </div>
                                        {showEvidence && (
                                            <div className="qp-evidence-list">
                                                {state.citations.map((cite, idx) => (
                                                    <div key={idx} className="qp-evidence-card">
                                                        <div className="qp-evidence-header mono">
                                                            <span style={{ color: 'var(--color-trust)' }}>{cite.source || 'Unknown'}</span>
                                                            <span style={{ color: 'var(--status-trusted)' }}>
                                                                {typeof cite.similarity === 'number'
                                                                    ? `${(cite.similarity * 100).toFixed(1)}% match`
                                                                    : ''}
                                                            </span>
                                                        </div>
                                                        <div className="qp-evidence-snippet">{cite.snippet || ''}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            )}
        </div>
    );
};

export default QueryPage;
