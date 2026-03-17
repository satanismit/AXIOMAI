import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'grid', gap: '2rem', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                            src="/logo.png"
                            alt="AXIOMAI Core"
                            style={{
                                height: '24px',
                                mixBlendMode: 'lighten',
                                filter: 'drop-shadow(0 0 10px var(--color-trust-dim))'
                            }}
                        />
                        AXIOMAI_CORE
                    </h1>
                    <div className="mono" style={{ color: 'var(--status-trusted)', fontSize: '0.85rem' }}>
                        &gt; SYSTEM READY. VERIFICATION PIPELINE ACTIVE.
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ color: 'var(--text-muted)' }}>VERSION: 1.2.0</div>
                    <div className="mono" style={{ color: 'var(--text-muted)' }}>LATENCY: 42ms</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '2px solid var(--text-muted)' }}>
                    <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>SYSTEM_INFO</h2>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        Enterprise AI intelligence system built on absolute verification protocols. Generating responses exclusively from mathematically verified context vectors.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '2px solid var(--color-trust)' }}>
                    <h2 style={{ fontSize: '0.9rem', color: 'var(--color-trust)', marginBottom: '1rem' }}>ACTIVE_PIPELINE</h2>
                    <div className="mono" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>[01] RETRIEVE</span>
                            <span style={{ color: 'var(--status-trusted)' }}>OK</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>[02] GENERATE</span>
                            <span style={{ color: 'var(--status-trusted)' }}>OK</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>[03] VERIFY</span>
                            <span style={{ color: 'var(--status-trusted)' }}>OK</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>[04] TRUST</span>
                            <span style={{ color: 'var(--color-trust)' }}>ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/query')}
                    className="mono"
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'var(--color-trust)',
                        color: '#000',
                        fontSize: '0.9rem',
                        border: '1px solid var(--color-trust)'
                    }}
                >
                    [ INTIALIZE_QUERY ]
                </button>
                <button
                    onClick={() => navigate('/system')}
                    className="mono"
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        border: '1px solid var(--border-subtle)'
                    }}
                    onMouseOver={(e) => { e.target.style.borderColor = 'var(--text-primary)'; e.target.style.background = 'var(--bg-tertiary)'; }}
                    onMouseOut={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.background = 'var(--bg-secondary)'; }}
                >
                    [ READ_SYSTEM_DOCS ]
                </button>
            </div>

            {/* Massive Hero Typography Component at the end of the page */}
            <div style={{
                marginTop: '6rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                userSelect: 'none',
                pointerEvents: 'none'
            }}>
                <div style={{
                    fontSize: 'clamp(5rem, 16vw, 14rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.06em',
                    lineHeight: 0.8,
                    background: 'linear-gradient(to bottom, var(--text-primary) 30%, transparent 120%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    opacity: 0.9,
                    position: 'relative'
                }}>
                    AXIOM
                    <span style={{
                        color: 'var(--color-trust)',
                        WebkitTextFillColor: 'var(--color-trust)',
                        textShadow: '0 0 60px rgba(45, 212, 191, 0.4)'
                    }}>
                        AI
                    </span>
                </div>
            </div>

        </div>
    );
};

export default Home;
