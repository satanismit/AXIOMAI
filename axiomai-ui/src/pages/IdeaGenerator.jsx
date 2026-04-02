import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../lib/api';

const IdeaGenerator = () => {
    const [papers, setPapers] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [ideas, setIdeas] = useState(null);
    const [error, setError] = useState(null);
    const [savedSet, setSavedSet] = useState(new Set());
    const [savingIdx, setSavingIdx] = useState(null);

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const res = await fetchWithAuth('/documents');
                const data = await res.json();
                setPapers(data.filter(d => d.upload_status === 'indexed'));
            } catch (err) {
                console.error("Failed to fetch documents", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }, []);

    const toggleSelect = (docId) => {
        setSelected(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : prev.length < 5 ? [...prev, docId] : prev
        );
    };

    const handleGenerate = async () => {
        if (selected.length < 1) return;
        setGenerating(true);
        setError(null);
        setIdeas(null);

        try {
            const res = await fetchWithAuth('/generate-ideas', {
                method: 'POST',
                body: { paper_ids: selected },
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            if (data.parse_error && data.raw_response) {
                // LLM responded but JSON couldn't be parsed — show raw text
                setIdeas([{
                    title: "AI-Generated Ideas (Raw Format)",
                    description: data.raw_response,
                    problem: "",
                    solution: "",
                    target_users: ""
                }]);
            } else {
                setIdeas(data.ideas || []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    const ideaColors = [
        'var(--color-trust)',
        'var(--color-intelligence)',
        '#f59e0b',
        '#ec4899',
        '#8b5cf6)',
    ];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Header */}
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
                <h1 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                    <span style={{ color: '#f59e0b' }}>//</span> STARTUP IDEA GENERATOR
                </h1>
                <p className="mono" style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                    Transform research insights into actionable startup concepts
                </p>
            </div>

            {/* Paper Selection */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 className="mono" style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem', letterSpacing: '1px' }}>
                    [ SELECT RESEARCH PAPERS ]
                </h3>

                {loading ? (
                    <p className="mono" style={{ color: 'var(--text-muted)' }}>LOADING DOCUMENTS...</p>
                ) : papers.length === 0 ? (
                    <p className="mono" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                        No indexed papers found. Upload and index papers first in the Copilot section.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {papers.map(paper => {
                            const isSelected = selected.includes(paper.id);
                            return (
                                <button
                                    key={paper.id}
                                    onClick={() => toggleSelect(paper.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        background: isSelected ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                                        border: isSelected ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: 'var(--text-primary)',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                        width: '100%',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    <span style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '4px',
                                        border: isSelected ? '2px solid #f59e0b' : '2px solid var(--text-muted)',
                                        background: isSelected ? '#f59e0b' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.7rem',
                                        color: '#000',
                                        fontWeight: 'bold',
                                        flexShrink: 0
                                    }}>
                                        {isSelected ? '✓' : ''}
                                    </span>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {paper.file_name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Generate Button */}
                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={handleGenerate}
                        disabled={selected.length < 1 || generating}
                        className="mono"
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: selected.length >= 1 ? '#f59e0b' : 'var(--bg-secondary)',
                            color: selected.length >= 1 ? '#000' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: selected.length >= 1 && !generating ? 'pointer' : 'not-allowed',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {generating ? 'GENERATING IDEAS...' : `GENERATE IDEAS FROM ${selected.length} PAPER${selected.length !== 1 ? 'S' : ''}`}
                    </button>
                    <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {selected.length}/5 selected
                    </span>
                </div>
            </div>

            {/* Loading State */}
            {generating && (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💡</p>
                    <p className="mono" style={{ color: '#f59e0b', fontSize: '1rem', marginBottom: '0.5rem' }}>
                        ANALYZING RESEARCH INSIGHTS...
                    </p>
                    <p className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        Extracting key themes · Identifying market gaps · Generating ideas
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid var(--status-risk)' }}>
                    <p className="mono" style={{ color: 'var(--status-risk)', fontSize: '0.85rem' }}>
                        [ERROR] {error}
                    </p>
                </div>
            )}

            {/* Generated Ideas */}
            {ideas && ideas.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h3 className="mono" style={{ color: '#f59e0b', fontSize: '0.85rem', letterSpacing: '1px' }}>
                        // GENERATED_IDEAS ({ideas.length})
                    </h3>

                    {ideas.map((idea, idx) => {
                        const accentColor = ideaColors[idx % ideaColors.length];
                        return (
                            <div key={idx} className="glass-panel" style={{
                                padding: '1.5rem',
                                borderLeft: `3px solid ${accentColor}`,
                                transition: 'transform 0.2s',
                            }}>
                                {/* Idea Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <span style={{
                                        background: accentColor,
                                        color: '#000',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '4px',
                                        fontFamily: 'var(--font-mono)'
                                    }}>
                                        IDEA {String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                                        {idea.title}
                                    </h3>
                                </div>

                                {/* Description */}
                                {idea.description && (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem', fontStyle: 'italic' }}>
                                        {idea.description}
                                    </p>
                                )}

                                {/* Info Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    {/* Problem */}
                                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                                        <h4 className="mono" style={{ color: 'var(--status-risk)', fontSize: '0.75rem', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                                            PROBLEM SOLVED
                                        </h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                                            {idea.problem}
                                        </p>
                                    </div>

                                    {/* Solution */}
                                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                                        <h4 className="mono" style={{ color: 'var(--color-trust)', fontSize: '0.75rem', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                                            SOLUTION
                                        </h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                                            {idea.solution}
                                        </p>
                                    </div>

                                    {/* Target Users */}
                                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                                        <h4 className="mono" style={{ color: 'var(--color-intelligence)', fontSize: '0.75rem', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                                            TARGET USERS
                                        </h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                                            {idea.target_users || idea.users}
                                        </p>
                                    </div>

                                    {/* Tech Stack */}
                                    {idea.tech_stack && (
                                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                                            <h4 className="mono" style={{ color: '#8b5cf6', fontSize: '0.75rem', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                                                TECH STACK
                                            </h4>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                                                {idea.tech_stack}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Save Button */}
                                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={async () => {
                                            setSavingIdx(idx);
                                            try {
                                                await fetchWithAuth('/ideas/save', {
                                                    method: 'POST',
                                                    body: {
                                                        title: idea.title || '',
                                                        description: idea.description || '',
                                                        problem: idea.problem || '',
                                                        solution: idea.solution || '',
                                                        target_users: idea.target_users || idea.users || '',
                                                        tech_stack: idea.tech_stack || '',
                                                        source_papers: selected,
                                                    },
                                                });
                                                setSavedSet(prev => new Set([...prev, idx]));
                                            } catch (err) {
                                                alert('Failed to save: ' + err.message);
                                            } finally {
                                                setSavingIdx(null);
                                            }
                                        }}
                                        disabled={savedSet.has(idx) || savingIdx === idx}
                                        className="mono"
                                        style={{
                                            padding: '0.5rem 1.25rem',
                                            background: savedSet.has(idx) ? 'var(--color-trust-dim)' : 'transparent',
                                            color: savedSet.has(idx) ? 'var(--color-trust)' : '#f59e0b',
                                            border: savedSet.has(idx) ? '1px solid var(--color-trust)' : '1px solid #f59e0b',
                                            borderRadius: '6px',
                                            cursor: savedSet.has(idx) ? 'default' : 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {savedSet.has(idx) ? 'SAVED' : savingIdx === idx ? 'SAVING...' : 'SAVE IDEA'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty ideas state */}
            {ideas && ideas.length === 0 && (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p className="mono" style={{ color: 'var(--text-muted)' }}>
                        No ideas could be generated. Try selecting different papers.
                    </p>
                </div>
            )}

            {/* Raw fallback */}
            {ideas === undefined && error === null && !generating && (
                null
            )}
        </div>
    );
};

export default IdeaGenerator;
