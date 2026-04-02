import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadDropzone from '../components/copilot/UploadDropzone';
import { fetchWithAuth } from '../lib/api';

const CopilotUpload = () => {
    const navigate = useNavigate();
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const fetchDocuments = async () => {
        try {
            const res = await fetchWithAuth('/documents');
            const data = await res.json();
            setPapers(data.map(doc => ({
                id: doc.id,
                name: doc.file_name,
                status: doc.upload_status.charAt(0).toUpperCase() + doc.upload_status.slice(1)
            })));
        } catch (err) {
            console.error("Failed to fetch documents", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleUploadSuccess = () => {
        fetchDocuments();
    };

    const handleDelete = async (paperId, paperName) => {
        if (!window.confirm(`Delete "${paperName}"?\n\nThis will permanently remove the document, all its indexed vectors, and stored files.`)) {
            return;
        }

        setDeletingId(paperId);
        try {
            await fetchWithAuth(`/documents/${paperId}`, { method: 'DELETE' });
            setPapers(prev => prev.filter(p => p.id !== paperId));
        } catch (err) {
            alert(`Failed to delete: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
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
                            alignItems: 'center',
                            opacity: deletingId === paper.id ? 0.5 : 1,
                            transition: 'opacity 0.3s'
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
                            
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button 
                                    onClick={() => navigate(`/dashboard/copilot/chat?doc_id=${paper.id}&doc_name=${encodeURIComponent(paper.name)}`)}
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

                                <button 
                                    onClick={() => handleDelete(paper.id, paper.name)}
                                    disabled={deletingId === paper.id}
                                    className="mono"
                                    style={{
                                        background: 'transparent',
                                        color: 'var(--text-muted)',
                                        border: '1px solid var(--border-subtle)',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '6px',
                                        cursor: deletingId === paper.id ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '0.8rem'
                                    }}
                                    onMouseOver={(e) => {
                                        if (deletingId !== paper.id) {
                                            e.currentTarget.style.borderColor = 'var(--status-risk)';
                                            e.currentTarget.style.color = 'var(--status-risk)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                        e.currentTarget.style.color = 'var(--text-muted)';
                                    }}
                                >
                                    {deletingId === paper.id ? '...' : '✕'}
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {papers.length === 0 && (
                        <div className="mono" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-subtle)', borderRadius: '12px' }}>
                            {loading ? "LOADING DOCUMENTS..." : "NO DOCUMENTS INDEXED YET."}
                        </div>
                    )}
                </div>
            </div>
            
        </div>
    );
};

export default CopilotUpload;
