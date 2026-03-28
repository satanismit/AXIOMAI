import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const InsightCard = ({ title, content, isExpanded, onToggle }) => (
    <div style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        overflow: 'hidden',
        background: isExpanded ? 'rgba(45, 212, 191, 0.05)' : 'transparent',
        transition: 'all 0.3s ease'
    }}>
        <button 
            onClick={onToggle}
            className="mono"
            style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.8rem'
            }}
        >
            <span>{title}</span>
            <span>{isExpanded ? '-' : '+'}</span>
        </button>
        {isExpanded && (
            <div style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {content}
            </div>
        )}
    </div>
);

const SummaryPanel = ({ documentName }) => {
    const [summaryData, setSummaryData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedSection, setExpandedSection] = useState(null);

    const generateSummary = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const res = await fetch(`http://localhost:8000/api/summary?file_name=${encodeURIComponent(documentName)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error("Backend connection failed.");
            
            const data = await res.json();
            
            // Basic Markdown Parsing based on prompted structure:
            // "1. **Research Contribution**" etc.
            const rawText = data.summary;
            const sections = parseSummaryText(rawText);
            setSummaryData(sections);
        } catch (err) {
            setError(err.message || "Failed to generate summary");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper: rudimentarily extracts standard sections from the returned LLM string
    const parseSummaryText = (text) => {
        const parsed = [];
        const regex = /\d+\.\s\*\*(.*?)\*\*(.*?)(?=\d+\.\s\*\*|$)/gs;
        let match;
        while ((match = regex.exec(text)) !== null) {
            let title = match[1].trim().toUpperCase();
            if (title.endsWith(':')) title = title.slice(0, -1);
            
            let content = match[2].trim().replace(/\*/g, '');
            if (content.startsWith(':')) content = content.substring(1).trim();

            parsed.push({
                title: title,
                content: content || "Content not elaborated by intelligence engine."
            });
        }
        
        // Fallback if formatting was slightly off
        if (parsed.length === 0) {
            return [{ title: "RESEARCH OVERVIEW", content: text }];
        }
        
        return parsed;
    };

    if (!summaryData && !isLoading) {
        return (
            <div className="glass-panel" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ color: 'var(--color-trust)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <p className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Generate a structured insight breakdown for standard metric extraction.
                </p>
                <button 
                    onClick={generateSummary}
                    className="mono" 
                    style={{
                        background: 'var(--color-trust-dim)',
                        color: 'var(--color-trust)',
                        border: '1px solid var(--color-trust)',
                        padding: '0.6rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '0.8rem',
                        width: '100%'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-trust)'; e.currentTarget.style.color = 'var(--bg-primary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-trust-dim)'; e.currentTarget.style.color = 'var(--color-trust)'; }}
                >
                    GENERATE SUMMARY
                </button>
                {error && <p className="mono" style={{ color: 'var(--status-risk)', fontSize: '0.75rem' }}>[ERROR] {error}</p>}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <p className="mono" style={{ color: 'var(--color-intelligence)', animation: 'pulse 1.5s infinite' }}>
                    ANALYZING DOCUMENT TREE...
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {summaryData.map((section, idx) => (
                <InsightCard 
                    key={idx}
                    title={section.title}
                    content={section.content}
                    isExpanded={expandedSection === idx}
                    onToggle={() => setExpandedSection(expandedSection === idx ? null : idx)}
                />
            ))}
        </div>
    );
};

export default SummaryPanel;
