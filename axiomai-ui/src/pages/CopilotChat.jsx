import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ChatWindow from '../components/copilot/ChatWindow';
import SummaryPanel from '../components/copilot/SummaryPanel';
import AudioPlayer from '../components/copilot/AudioPlayer';
import { fetchWithAuth } from '../lib/api';

const CopilotChat = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const docId = searchParams.get('doc_id');
    const docName = searchParams.get('doc_name');
    const [audioState, setAudioState] = useState(null);
    const [viewerUrl, setViewerUrl] = useState(null);
    const [loadingViewer, setLoadingViewer] = useState(true);

    useEffect(() => {
        const fetchViewerUrl = async () => {
            if (!docId) return;
            try {
                const res = await fetchWithAuth(`/documents/${docId}`);
                if (res.ok) {
                    const data = await res.json();
                    setViewerUrl(data.signed_url || data.url);
                }
            } catch (err) {
                console.error("Failed to fetch document signed URL", err);
            } finally {
                setLoadingViewer(false);
            }
        };
        fetchViewerUrl();
    }, [docId]);

    return (
        <div style={{ width: '100%', padding: '0 1rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
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
                    onClick={() => navigate('/dashboard/copilot')}
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

            {/* Main Chat Grid (Split Screen Workspace 60/40) */}
            <div style={{ display: 'grid', gridTemplateColumns: '6fr 4fr', gap: '2rem' }}>
                
                {/* Chat Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '1px', margin: 0 }}>
                        [ CONVERSATIONAL THREAD ]
                    </h3>
                    <ChatWindow documentId={docId} documentName={docName} onPlayAudio={setAudioState} />
                </div>

                {/* Document Viewer Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '1px', margin: 0 }}>
                        [ DOCUMENT REFERENCE ]
                    </h3>
                    
                    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: 'calc(100vh - 150px)' }}>
                         {loadingViewer ? (
                             <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }} className="mono">
                                 [ LOADING SECURE VIEWER... ]
                             </div>
                         ) : viewerUrl ? (
                             <iframe src={`${viewerUrl}#toolbar=0&navpanes=0`} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Viewer" />
                         ) : (
                             <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--status-risk)' }} className="mono">
                                 [ ERROR LOADING PREVIEW ]
                             </div>
                         )}
                    </div>
                </div>

            </div>
            
        </div>
    );
};

export default CopilotChat;
