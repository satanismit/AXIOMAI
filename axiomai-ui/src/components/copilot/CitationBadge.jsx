import React from 'react';

const CitationBadge = ({ source }) => {
    // Hidden completely from UI per user request
    return null;

    const isWeb = source.type === 'web';

    return (
        <div 
            className="mono"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.75rem',
                background: isWeb ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-intelligence-dim)',
                color: isWeb ? '#60A5FA' : 'var(--color-intelligence)', // blue for web, purple for paper
                border: `1px solid ${isWeb ? 'rgba(59, 130, 246, 0.3)' : 'var(--color-intelligence)'}`,
                borderRadius: '6px',
                fontSize: '0.75rem',
                marginRight: '0.5rem',
                marginBottom: '0.5rem',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}
        >
            {isWeb ? (
                // Globe icon
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
            ) : (
                // Document icon
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isWeb ? source.url : "PAPER_SOURCE_NODE..."}
            </span>
        </div>
    );
};

export default CitationBadge;
