import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../lib/api';

const ComparePapers = () => {
    const [papers, setPapers] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comparing, setComparing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [paperNames, setPaperNames] = useState({});

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

    const handleCompare = async () => {
        if (selected.length < 2) return;
        setComparing(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetchWithAuth('/compare', {
                method: 'POST',
                body: { paper_ids: selected },
            });
            const data = await res.json();
            setResult(data.comparison);
            setPaperNames(data.papers || {});
        } catch (err) {
            setError(err.message);
        } finally {
            setComparing(false);
        }
    };

    const categories = [
        { key: 'methodology', label: 'METHODOLOGY' },
        { key: 'dataset', label: 'DATASET / BENCHMARK' },
        { key: 'architecture', label: 'ARCHITECTURE' },
        { key: 'performance', label: 'PERFORMANCE' },
    ];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Header */}
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
                <h1 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                    <span style={{ color: 'var(--color-intelligence)' }}>//</span> COMPARE PAPERS
                </h1>
                <p className="mono" style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                    Select 2-5 indexed papers to generate a structured comparison
                </p>
            </div>

            {/* Paper Selection */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 className="mono" style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem', letterSpacing: '1px' }}>
                    [ SELECT PAPERS ]
                </h3>

                {loading ? (
                    <p className="mono" style={{ color: 'var(--text-muted)' }}>LOADING DOCUMENTS...</p>
                ) : papers.length < 2 ? (
                    <p className="mono" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                        You need at least 2 indexed papers to compare. Upload and index more papers first.
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
                                        background: isSelected ? 'rgba(45, 212, 191, 0.08)' : 'transparent',
                                        border: isSelected ? '1px solid var(--color-trust)' : '1px solid var(--border-subtle)',
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
                                        border: isSelected ? '2px solid var(--color-trust)' : '2px solid var(--text-muted)',
                                        background: isSelected ? 'var(--color-trust)' : 'transparent',
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

                {/* Compare Button */}
                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={handleCompare}
                        disabled={selected.length < 2 || comparing}
                        className="mono"
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: selected.length >= 2 ? 'var(--color-trust)' : 'var(--bg-secondary)',
                            color: selected.length >= 2 ? '#000' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: selected.length >= 2 && !comparing ? 'pointer' : 'not-allowed',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {comparing ? 'COMPARING...' : `COMPARE ${selected.length} PAPER${selected.length !== 1 ? 'S' : ''}`}
                    </button>
                    <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {selected.length}/5 selected
                    </span>
                </div>
            </div>

            {/* Loading State */}
            {comparing && (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <p className="mono" style={{ color: 'var(--color-intelligence)', fontSize: '1rem', marginBottom: '0.5rem' }}>
                        ANALYZING RESEARCH PAPERS...
                    </p>
                    <p className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        Retrieving vectors · Building context · Generating comparison
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

            {/* Results */}
            {result && !result.parse_error && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Comparison Table */}
                    <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'auto' }}>
                        <h3 className="mono" style={{ color: 'var(--color-trust)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                            // STRUCTURED_COMPARISON
                        </h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th className="mono" style={thStyle}>CATEGORY</th>
                                    {Object.values(paperNames).map((name, i) => (
                                        <th key={i} className="mono" style={thStyle}>
                                            {name.replace('.pdf', '').substring(0, 30)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(cat => {
                                    const section = result[cat.key];
                                    if (!section) return null;
                                    const paperEntries = section.papers || {};
                                    return (
                                        <tr key={cat.key}>
                                            <td className="mono" style={{ ...tdStyle, color: 'var(--color-intelligence)', fontWeight: 600, fontSize: '0.8rem' }}>
                                                {cat.label}
                                            </td>
                                            {Object.values(paperNames).map((name, i) => (
                                                <td key={i} style={tdStyle}>
                                                    {paperEntries[name] || section.comparison || '—'}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Overall Comparison Summaries */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                        {categories.map(cat => {
                            const section = result[cat.key];
                            if (!section || !section.comparison) return null;
                            return (
                                <div key={cat.key} className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid var(--color-trust)' }}>
                                    <h4 className="mono" style={{ color: 'var(--color-trust)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                                        {cat.label}
                                    </h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                        {section.comparison}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Strengths & Weaknesses */}
                    {result.strengths_weaknesses && result.strengths_weaknesses.papers && (
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 className="mono" style={{ color: 'var(--color-intelligence)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                // STRENGTHS_AND_WEAKNESSES
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                                {Object.entries(result.strengths_weaknesses.papers).map(([paper, analysis]) => (
                                    <div key={paper} style={{ padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                                        <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                                            {paper.replace('.pdf', '')}
                                        </h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                            {typeof analysis === 'string' ? analysis : JSON.stringify(analysis)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Key Insights */}
                    {result.key_insights && result.key_insights.length > 0 && (
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 className="mono" style={{ color: 'var(--color-trust)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                // KEY_INSIGHTS
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {result.key_insights.map((insight, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        gap: '0.75rem',
                                        alignItems: 'flex-start',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(45, 212, 191, 0.05)',
                                        border: '1px solid var(--color-trust-dim)',
                                        borderRadius: '6px'
                                    }}>
                                        <span className="mono" style={{ color: 'var(--color-trust)', fontSize: '0.8rem', flexShrink: 0 }}>
                                            [{String(idx + 1).padStart(2, '0')}]
                                        </span>
                                        <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                            {insight}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Raw text fallback if JSON parse failed */}
            {result && result.parse_error && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 className="mono" style={{ color: 'var(--status-risk)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        // RAW_COMPARISON (JSON parse failed)
                    </h3>
                    <pre style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        {result.raw_comparison}
                    </pre>
                </div>
            )}
        </div>
    );
};

// Table styles
const thStyle = {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    borderBottom: '2px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    fontSize: '0.75rem',
    letterSpacing: '0.5px'
};

const tdStyle = {
    padding: '0.75rem 1rem',
    verticalAlign: 'top',
    borderBottom: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    lineHeight: 1.5
};

export default ComparePapers;
