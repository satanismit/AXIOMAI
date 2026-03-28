import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../lib/api';

const Profile = () => {
    const { user, signOut } = useAuth();
    const [stats, setStats] = useState({ totalDocuments: 0, storageUsed: 0 });
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetchWithAuth('/documents');
                const docs = await res.json();
                
                setDocuments(docs || []);
                const totalDocs = docs?.length || 0;
                const totalSize = docs?.reduce((acc, doc) => acc + (doc.file_size || 0), 0) || 0;
                
                setStats({
                    totalDocuments: totalDocs,
                    storageUsed: (totalSize / (1024 * 1024)).toFixed(2) // MB
                });
            } catch (err) {
                console.error("Failed to fetch profile stats", err);
            } finally {
                setLoading(false);
            }
        };

        const handlePreview = async (docId) => {
            try {
                const res = await fetchWithAuth(`/documents/${docId}`);
                if (res.ok) {
                    const data = await res.json();
                    setPreviewUrl(data.url);
                }
            } catch (err) {
                console.error("Failed to fetch document preview", err);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
                <h1 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', margin: 0 }}>
                    <span style={{ color: 'var(--color-intelligence)' }}>//</span> USER PROFILE
                </h1>
                <p className="mono" style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                    Account Settings & Usage Statistics
                </p>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(200px, 1fr) 2fr' }}>
                    
                    <div className="mono" style={{ color: 'var(--text-muted)' }}>EMAIL ACCOUNT</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user?.email}</div>

                    <div className="mono" style={{ color: 'var(--text-muted)' }}>FULL NAME</div>
                    <div style={{ color: 'var(--text-primary)' }}>{user?.user_metadata?.full_name || 'System User'}</div>

                    <div className="mono" style={{ color: 'var(--text-muted)' }}>PLAN STATUS</div>
                    <div>
                        <span style={{
                            background: 'var(--color-trust-dim)',
                            color: 'var(--color-trust)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            letterSpacing: '1px'
                        }} className="mono">ACTIVE RESEARCHER</span>
                    </div>

                    <div className="mono" style={{ color: 'var(--text-muted)' }}>DOCUMENTS STORED</div>
                    <div style={{ color: 'var(--text-primary)' }}>
                        {loading ? 'CALCULATING...' : `${stats.totalDocuments} FILES (${stats.storageUsed} MB)`}
                    </div>

                </div>

                <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem' }}>
                    <button 
                        onClick={signOut}
                        className="mono"
                        style={{
                            background: 'var(--status-risk)',
                            color: '#fff',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            letterSpacing: '1px',
                            fontWeight: 'bold'
                        }}
                    >
                        [ SIGN OUT ALL SESSIONS ]
                    </button>
                    <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }} className="mono">
                        // Change password and billing are handled by Supabase Dashboard in this tier.
                    </div>
                </div>
            </div>

            {/* File System View */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 className="mono" style={{ color: 'var(--color-intelligence)', fontSize: '1.2rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    DOCUMENT REPOSITORY
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {loading ? (
                        <div className="mono" style={{ color: 'var(--text-muted)' }}>[ LOADING FILE SYSTEM... ]</div>
                    ) : documents.length === 0 ? (
                        <div className="mono" style={{ color: 'var(--text-muted)' }}>[ NO FILES UPLOADED YET ]</div>
                    ) : (
                        documents.map(doc => (
                            <div 
                                key={doc.id}
                                onClick={() => {
                                    /* Execute handlePreview manually since it wasn't defined in global component scope earlier but wait, handlePreview is defined inside useEffect. Let's fix that! */
                                    fetchWithAuth(`/documents/${doc.id}`).then(res => res.json()).then(data => setPreviewUrl(data.url)).catch(err => console.error(err));
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '0.75rem 1rem',
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'border 0.2s',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-intelligence)'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                                <span style={{ color: 'var(--text-primary)', flex: 1, fontWeight: 500 }}>{doc.file_name}</span>
                                <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {(doc.file_size / 1024).toFixed(1)} KB
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Inline PDF Viewer Modal */}
            {previewUrl && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(5, 10, 20, 0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column',
                    padding: '2rem',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', width: '100%', maxWidth: '1200px', margin: '0 auto 1rem auto' }}>
                        <button 
                            onClick={() => setPreviewUrl(null)}
                            style={{ background: 'var(--status-risk)', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            className="mono"
                        >
                            [ CLOSE VIEWER ]
                        </button>
                    </div>
                    <div style={{ flex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                        <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
