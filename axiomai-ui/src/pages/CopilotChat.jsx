import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ChatWindow from '../components/copilot/ChatWindow';
import SummaryPanel from '../components/copilot/SummaryPanel';
import AudioPlayer from '../components/copilot/AudioPlayer';

const CopilotChat = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const docName = searchParams.get('doc');
    const [audioState, setAudioState] = useState(null);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
                <div>
                    <h1 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <span style={{ color: 'var(--color-intelligence)' }}>//</span> INTELLIGENCE SESSION
                    </h1>
                    <p className="mono" style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                        ACTIVE TARGET: <span style={{ color: 'var(--color-trust)' }}>{docName || 'System Demo Document'}</span>
                    </p>
                </div>
                
                <button 
                    onClick={() => navigate('/copilot')}
                    className="mono"
                    style={{
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--text-muted)',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '0.8rem'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-primary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
                >
                    &lt;- BACK TO UPLOADS
                </button>
            </div>

            {/* Main Chat Grid (Space reserved for summary panel on the right) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                
                {/* Chat Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '1px', margin: 0 }}>
                        [ CONVERSATIONAL THREAD ]
                    </h3>
                    <ChatWindow documentName={docName} onPlayAudio={setAudioState} />
                </div>

                {/* Sidebar Panel for Summaries and Future extensions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '1px', margin: 0 }}>
                        [ RESEARCH INSIGHTS ]
                    </h3>
                    
                    <SummaryPanel documentName={docName} />

                    {/* Audio Player Component */}
                    {audioState && audioState.status === 'loading' && (
                        <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', marginTop: '1rem' }}>
                            <p className="mono" style={{ color: 'var(--color-intelligence)', animation: 'pulse 1.5s infinite', fontSize: '0.8rem' }}>
                                SYNTHESIZING AUDIO...
                            </p>
                        </div>
                    )}
                    {audioState && audioState.status === 'ready' && (
                        <AudioPlayer 
                            url={audioState.url} 
                            text={audioState.text} 
                            onClose={() => setAudioState(null)} 
                        />
                    )}
                </div>

            </div>
            
        </div>
    );
};

export default CopilotChat;
