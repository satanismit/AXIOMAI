import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../lib/api';

const Profile = () => {
    const { user, signOut } = useAuth();
    const [stats, setStats] = useState({ totalDocuments: 0, storageUsed: 0 });
    const [documents, setDocuments] = useState([]);
    const [savedIdeas, setSavedIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingIdeas, setLoadingIdeas] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [deletingIdeaId, setDeletingIdeaId] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);
    const [expandedIdeaId, setExpandedIdeaId] = useState(null);

    const fetchDocuments = async () => {
        try {
            const res = await fetchWithAuth('/documents');
            const docs = await res.json();
            setDocuments(docs || []);
            const totalDocs = docs?.length || 0;
            const totalSize = docs?.reduce((acc, doc) => acc + (doc.file_size || 0), 0) || 0;
            setStats({
                totalDocuments: totalDocs,
                storageUsed: (totalSize / (1024 * 1024)).toFixed(2)
            });
        } catch (err) {
            console.error("Failed to fetch profile stats", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedIdeas = async () => {
        try {
            const res = await fetchWithAuth('/ideas/saved');
            const data = await res.json();
            setSavedIdeas(data || []);
        } catch (err) {
            console.error("Failed to fetch saved ideas", err);
        } finally {
            setLoadingIdeas(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchDocuments();
            fetchSavedIdeas();
        }
    }, [user]);

    const handleUpload = async (file) => {
        if (file.type !== 'application/pdf') {
            setUploadError("Must be a PDF file.");
            return;
        }
        setIsUploading(true);
        setUploadError(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            await fetchWithAuth('/documents/upload', { method: 'POST', body: formData });
            fetchDocuments();
        } catch (err) {
            setUploadError(err.message || 'Upload failed');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (docId, docName) => {
        if (!window.confirm(`Delete "${docName}"?\n\nThis will permanently remove the document, all its indexed vectors, and stored files.`)) return;
        setDeletingId(docId);
        try {
            await fetchWithAuth(`/documents/${docId}`, { method: 'DELETE' });
            setDocuments(prev => prev.filter(d => d.id !== docId));
            setStats(prev => ({ ...prev, totalDocuments: prev.totalDocuments - 1 }));
        } catch (err) {
            alert(`Failed to delete: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteIdea = async (ideaId) => {
        if (!window.confirm('Delete this saved idea?')) return;
        setDeletingIdeaId(ideaId);
        try {
            await fetchWithAuth(`/ideas/saved/${ideaId}`, { method: 'DELETE' });
            setSavedIdeas(prev => prev.filter(i => i.id !== ideaId));
        } catch (err) {
            alert(`Failed to delete idea: ${err.message}`);
        } finally {
            setDeletingIdeaId(null);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
                <h1 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', margin: 0 }}>
                    <span style={{ color: 'var(--color-intelligence)' }}>//</span> USER PROFILE
                </h1>
                <p className="mono" style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                    Account Settings · Documents · Saved Ideas
                </p>
            </div>

            {/* Account Info */}
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

                    <div className="mono" style={{ color: 'var(--text-muted)' }}>SAVED IDEAS</div>
                    <div style={{ color: 'var(--text-primary)' }}>
                        {loadingIdeas ? 'LOADING...' : `${savedIdeas.length} IDEAS`}
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
                </div>
            </div>

            {/* Upload Section */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 className="mono" style={{ color: 'var(--color-trust)', fontSize: '1rem', margin: '0 0 1.25rem 0', letterSpacing: '1px' }}>
                    [ UPLOAD DOCUMENT ]
                </h2>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        padding: '2rem',
                        textAlign: 'center',
                        border: '1px dashed var(--text-muted)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-trust)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                    <p className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                        {isUploading ? 'UPLOADING & INDEXING...' : 'CLICK TO UPLOAD PDF'}
                    </p>
                </div>
                {uploadError && (
                    <p className="mono" style={{ color: 'var(--status-risk)', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                        [ERROR] {uploadError}
                    </p>
                )}
            </div>

            {/* Document Repository with Delete */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 className="mono" style={{ color: 'var(--color-intelligence)', fontSize: '1rem', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    DOCUMENT REPOSITORY
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {loading ? (
                        <div className="mono" style={{ color: 'var(--text-muted)' }}>[ LOADING FILE SYSTEM... ]</div>
                    ) : documents.length === 0 ? (
                        <div className="mono" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>[ NO FILES UPLOADED YET ]</div>
                    ) : (
                        documents.map(doc => (
                            <div
                                key={doc.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '0.75rem 1rem',
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '6px',
                                    opacity: deletingId === doc.id ? 0.5 : 1,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                                <span style={{ color: 'var(--text-primary)', flex: 1, fontWeight: 500 }}>{doc.file_name}</span>
                                <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                    {(doc.file_size / 1024).toFixed(1)} KB
                                </span>
                                <span className="mono" style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    background: doc.upload_status === 'indexed' ? 'var(--color-trust-dim)' : 'rgba(245,158,11,0.1)',
                                    color: doc.upload_status === 'indexed' ? 'var(--color-trust)' : '#f59e0b',
                                }}>
                                    {doc.upload_status?.toUpperCase()}
                                </span>
                                <button
                                    onClick={() => handleDelete(doc.id, doc.file_name)}
                                    disabled={deletingId === doc.id}
                                    className="mono"
                                    style={{
                                        background: 'transparent',
                                        color: 'var(--text-muted)',
                                        border: '1px solid var(--border-subtle)',
                                        padding: '0.35rem 0.6rem',
                                        borderRadius: '4px',
                                        cursor: deletingId === doc.id ? 'not-allowed' : 'pointer',
                                        fontSize: '0.75rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { if (deletingId !== doc.id) { e.currentTarget.style.borderColor = 'var(--status-risk)'; e.currentTarget.style.color = 'var(--status-risk)'; } }}
                                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                                >
                                    {deletingId === doc.id ? '...' : '✕ DELETE'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Saved Ideas */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 className="mono" style={{ color: '#f59e0b', fontSize: '1rem', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px' }}>
                    💡 SAVED IDEAS
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loadingIdeas ? (
                        <div className="mono" style={{ color: 'var(--text-muted)' }}>[ LOADING SAVED IDEAS... ]</div>
                    ) : savedIdeas.length === 0 ? (
                        <div className="mono" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                            [ NO SAVED IDEAS YET — Generate ideas from the IDEAS page and save them ]
                        </div>
                    ) : (
                        savedIdeas.map(idea => (
                            <div
                                key={idea.id}
                                style={{
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '8px',
                                    borderLeft: '3px solid #f59e0b',
                                    opacity: deletingIdeaId === idea.id ? 0.5 : 1,
                                    transition: 'all 0.3s',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Accordion Header — always visible */}
                                <div
                                    onClick={() => setExpandedIdeaId(expandedIdeaId === idea.id ? null : idea.id)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1rem 1.25rem',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                        <span style={{
                                            color: expandedIdeaId === idea.id ? '#f59e0b' : 'var(--text-muted)',
                                            fontSize: '0.85rem',
                                            transition: 'transform 0.3s, color 0.3s',
                                            transform: expandedIdeaId === idea.id ? 'rotate(90deg)' : 'rotate(0deg)',
                                            flexShrink: 0,
                                        }}>▶</span>
                                        <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.95rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {idea.title}
                                        </h3>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                        <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                            {new Date(idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteIdea(idea.id); }}
                                            disabled={deletingIdeaId === idea.id}
                                            className="mono"
                                            style={{
                                                background: 'transparent',
                                                color: 'var(--text-muted)',
                                                border: '1px solid var(--border-subtle)',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.65rem',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--status-risk)'; e.currentTarget.style.color = 'var(--status-risk)'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                                        >
                                            {deletingIdeaId === idea.id ? '...' : 'DELETE'}
                                        </button>
                                    </div>
                                </div>

                                {/* Accordion Body — expanded content */}
                                {expandedIdeaId === idea.id && (
                                    <div style={{
                                        padding: '0 1.25rem 1.25rem 1.25rem',
                                        borderTop: '1px solid var(--border-subtle)',
                                        animation: 'fadeIn 0.25s ease',
                                    }}>
                                        {idea.description && (
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginTop: '1rem', marginBottom: '1rem', fontStyle: 'italic' }}>
                                                {idea.description}
                                            </p>
                                        )}

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                                            {idea.problem && (
                                                <div>
                                                    <span className="mono" style={{ color: 'var(--status-risk)', fontSize: '0.7rem' }}>PROBLEM</span>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>{idea.problem}</p>
                                                </div>
                                            )}
                                            {idea.solution && (
                                                <div>
                                                    <span className="mono" style={{ color: 'var(--color-trust)', fontSize: '0.7rem' }}>SOLUTION</span>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>{idea.solution}</p>
                                                </div>
                                            )}
                                            {idea.target_users && (
                                                <div>
                                                    <span className="mono" style={{ color: 'var(--color-intelligence)', fontSize: '0.7rem' }}>TARGET USERS</span>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>{idea.target_users}</p>
                                                </div>
                                            )}
                                            {idea.tech_stack && (
                                                <div>
                                                    <span className="mono" style={{ color: '#8b5cf6', fontSize: '0.7rem' }}>TECH STACK</span>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>{idea.tech_stack}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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
