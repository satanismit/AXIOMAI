import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadDropzone from '../components/copilot/UploadDropzone';

const CopilotUpload = () => {
    const navigate = useNavigate();
    const [papers, setPapers] = useState([
        { id: 1, name: 'Sample_Research_Paper.pdf', status: 'Indexed' }
    ]);

    const handleUploadSuccess = (newPaper) => {
        setPapers(prev => [
            { id: Date.now(), name: newPaper.name, status: newPaper.status },
            ...prev
        ]);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
                <h1 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                    <span style={{ color: 'var(--color-intelligence)' }}>//</span> RESEARCH COPILOT
                </h1>
                <p className="mono" style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                    Document Intelligence & Vector Retrieval System
                </p>
            </div>

            <UploadDropzone onUploadSuccess={handleUploadSuccess} />

            <div style={{ marginTop: '1rem' }}>
                <h3 className="mono" style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.85rem', letterSpacing: '1px' }}>
                    [ INDEXED DOCUMENTS ]
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {papers.map(paper => (
                        <div key={paper.id} className="glass-panel" style={{ 
                            padding: '1.25rem', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center'
                        }}>
                            <div>
                                <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem', fontWeight: 500, letterSpacing: 'normal', textTransform: 'none' }}>
                                    {paper.name}
                                </h4>
                                <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                                    <span style={{ 
                                        width: 8, height: 8, borderRadius: '50%', 
                                        background: paper.status === 'Indexed' ? 'var(--color-trust)' : 'var(--status-risk)',
                                        boxShadow: paper.status === 'Indexed' ? '0 0 8px var(--color-trust-dim)' : 'none'
                                    }}></span>
                                    <span style={{ color: 'var(--text-muted)' }}>STATUS: {paper.status.toUpperCase()}</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => navigate(`/copilot/chat?doc=${encodeURIComponent(paper.name)}`)}
                                className="mono"
                                style={{
                                    background: 'var(--color-intelligence-dim)',
                                    color: 'var(--color-intelligence)',
                                    border: '1px solid var(--color-intelligence)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '0.8rem',
                                    letterSpacing: '0.5px'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'var(--color-intelligence)';
                                    e.currentTarget.style.color = '#fff';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'var(--color-intelligence-dim)';
                                    e.currentTarget.style.color = 'var(--color-intelligence)';
                                }}
                            >
                                OPEN CHAT -{'>'}
                            </button>
                        </div>
                    ))}
                    
                    {papers.length === 0 && (
                        <div className="mono" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-subtle)', borderRadius: '12px' }}>
                            NO DOCUMENTS INDEXED YET. 
                        </div>
                    )}
                </div>
            </div>
            
        </div>
    );
};

export default CopilotUpload;
