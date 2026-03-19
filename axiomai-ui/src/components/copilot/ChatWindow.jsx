import React, { useState, useRef, useEffect } from 'react';
import CitationBadge from './CitationBadge';

const ChatWindow = ({ documentName, onPlayAudio }) => {
    const [messages, setMessages] = useState([
        { role: 'system', content: `RESEARCH COPILOT ONLINE. Analyzing context for: ${documentName || 'Unknown Document'}`, isWebSearch: false, sources: [] }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setInput('');
        
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        try {
            // Using default 8000 for FastAPI local server
            const res = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg })
            });

            if (!res.ok) throw new Error("Backend connection failed.");
            const data = await res.json();
            
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: data.answer,
                isWebSearch: data.routed_to_web,
                sources: data.sources || []
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: `[ERROR] ${error.message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleListen = async (text) => {
        if(!onPlayAudio) return;
        
        try {
            onPlayAudio({ status: 'loading', text });
            const res = await fetch('http://localhost:8000/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await res.json();
            if (data.status === 'success') {
                onPlayAudio({ status: 'ready', url: `http://localhost:8000${data.audio_url}`, text });
            } else {
                console.error("TTS Error:", data.message);
                onPlayAudio(null);
            }
        } catch(e) {
             console.error("Network Error during TTS:", e);
             onPlayAudio(null);
        }
    };

    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: '1.5rem', position: 'relative' }}>
            
            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{ 
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%'
                    }}>
                        <div style={{ 
                            background: msg.role === 'user' ? 'var(--color-trust-dim)' : 'transparent',
                            border: msg.role === 'user' ? '1px solid var(--color-trust)' : 'none',
                            padding: msg.role === 'user' ? '1rem 1.25rem' : '0.5rem 0',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem',
                            lineHeight: '1.6'
                        }}>
                            {msg.role === 'assistant' && (
                                <div className="mono" style={{ color: 'var(--color-intelligence)', marginBottom: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>{'//'} COPILOT_RESPONSE</span>
                                    {msg.isWebSearch && (
                                        <span style={{ background: '#3b82f6', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>
                                            WEB SEARCH FALLBACK
                                        </span>
                                    )}
                                </div>
                            )}
                            
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                            
                            {/* Sources and Features under assistant messages */}
                            {msg.role === 'assistant' && msg.content && msg.role !== 'system' && (
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {msg.sources && msg.sources.map((src, s_idx) => (
                                        <CitationBadge key={s_idx} source={src} />
                                    ))}
                                    
                                    <button onClick={() => handleListen(msg.content)} className="mono" style={{
                                        background: 'transparent',
                                        border: '1px solid var(--text-muted)',
                                        color: 'var(--text-secondary)',
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        transition: 'all 0.2s'
                                    }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                        LISTEN AUDIO
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {isTyping && (
                    <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-intelligence)' }}>
                        <span className="mono" style={{ fontSize: '0.85rem' }}>GENERATING INSIGHTS...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ marginTop: '1rem', position: 'relative' }}>
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask a question about the research..."
                    style={{
                        width: '100%',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        padding: '1rem 4rem 1rem 1.5rem',
                        borderRadius: '8px',
                        outline: 'none',
                        fontFamily: "'Inter', sans-serif"
                    }}
                />
                <button 
                    onClick={handleSend}
                    disabled={isTyping}
                    style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: isTyping ? 'var(--bg-secondary)' : 'var(--color-trust)',
                        color: isTyping ? 'var(--text-muted)' : 'var(--bg-primary)',
                        border: 'none',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        cursor: isTyping ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
            
        </div>
    );
};

export default ChatWindow;
