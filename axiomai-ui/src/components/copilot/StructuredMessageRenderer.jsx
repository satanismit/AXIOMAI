import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Strip any raw HTML tags from LLM output before Markdown parsing.
 * This handles cases where the LLM returns <p>, <strong>, etc. instead of Markdown.
 */
function stripHtml(text) {
    if (!text) return '';
    return text
        .replace(/<\/?p>/gi, '\n')
        .replace(/<\/?strong>/gi, '**')
        .replace(/<\/?em>/gi, '*')
        .replace(/<\/?br\s*\/?>/gi, '\n')
        .replace(/<\/?h([1-6])>/gi, (_, level) => '#'.repeat(parseInt(level)) + ' ')
        .replace(/<\/?ul>/gi, '\n')
        .replace(/<\/?ol>/gi, '\n')
        .replace(/<li>/gi, '- ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

const StructuredMessageRenderer = ({ content }) => {
    const cleanContent = stripHtml(content);
    return (
        <ReactMarkdown
            components={{
                h1: ({node, ...props}) => <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4em', fontWeight: '600', marginTop: '1.5em', marginBottom: '0.75em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.3em' }} {...props} />,
                h2: ({node, ...props}) => <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25em', fontWeight: '600', marginTop: '1.5em', marginBottom: '0.75em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.3em' }} {...props} />,
                h3: ({node, ...props}) => <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1em', fontWeight: '600', marginTop: '1.25em', marginBottom: '0.5em' }} {...props} />,
                p: ({node, ...props}) => <p style={{ marginBottom: '1em', lineHeight: '1.6', color: 'var(--text-primary)' }} {...props} />,
                ul: ({node, ...props}) => <ul style={{ marginBottom: '1em', paddingLeft: '1.5em', listStyleType: 'disc', color: 'var(--text-secondary)' }} {...props} />,
                ol: ({node, ...props}) => <ol style={{ marginBottom: '1em', paddingLeft: '1.5em', listStyleType: 'decimal', color: 'var(--text-secondary)' }} {...props} />,
                li: ({node, ...props}) => <li style={{ marginBottom: '0.5em', lineHeight: '1.6' }} {...props} />,
                blockquote: ({node, ...props}) => (
                    <blockquote className="glass-panel" style={{ 
                        margin: '1.5em 0', 
                        padding: '1em 1.5em', 
                        borderLeft: '4px solid var(--color-intelligence)',
                        color: 'var(--text-primary)',
                        fontStyle: 'italic',
                        borderRadius: '0 8px 8px 0',
                        background: 'var(--bg-secondary)'
                    }} {...props} />
                ),
                strong: ({node, ...props}) => <strong style={{ color: 'var(--text-primary)', fontWeight: '600' }} {...props} />,
                code({node, inline, className, children, ...props}) {
                    return inline ? (
                        <code style={{
                            background: 'var(--bg-secondary)',
                            padding: '0.2em 0.4em',
                            borderRadius: '4px',
                            fontSize: '0.9em',
                            fontFamily: 'monospace',
                            color: 'var(--text-primary)'
                        }} {...props}>
                            {children}
                        </code>
                    ) : (
                        <pre className="glass-panel" style={{
                            background: 'var(--bg-secondary)',
                            padding: '1em',
                            borderRadius: '8px',
                            overflowX: 'auto',
                            margin: '1.5em 0',
                            border: '1px solid var(--border-subtle)',
                            fontFamily: 'monospace',
                            fontSize: '0.9em'
                        }}>
                            <code {...props} className={className} style={{ color: 'var(--text-primary)' }}>
                                {children}
                            </code>
                        </pre>
                    )
                }
            }}
        >
            {cleanContent}
        </ReactMarkdown>
    );
};

export default StructuredMessageRenderer;
