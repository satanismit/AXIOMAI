import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicHomePage = () => {
    const { session, loading } = useAuth();
    
    // Redirect logged-in users directly to dashboard
    if (!loading && session) {
        return <Navigate to="/dashboard/home" replace />;
    }

    const [openFaq, setOpenFaq] = useState(null);
    const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

    if (loading) {
        return <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}></div>;
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
            
            {/* 1. NAVIGATION HEADER */}
            <header className="glass-panel" style={{ 
                position: 'sticky',
                top: 0,
                zIndex: 50,
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '1rem 2rem', 
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'rgba(9, 9, 11, 0.85)',
                backdropFilter: 'blur(12px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/logo.png" alt="AXIOMAI Logo" style={{ height: '24px', mixBlendMode: 'lighten' }} />
                    <span className="logo-text" style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '1px' }}>AXIOMAI</span>
                </div>

                <div className="mono" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
                        [LOGIN]
                    </Link>
                    <Link to="/signup" style={{ 
                        color: '#000', 
                        background: 'var(--color-trust)', 
                        textDecoration: 'none', 
                        fontSize: '0.85rem',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '4px',
                        fontWeight: 600,
                        transition: 'box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.boxShadow = '0 0 15px rgba(45, 212, 191, 0.4)'}
                    onMouseOut={(e) => e.target.style.boxShadow = 'none'}>
                        [SIGNUP]
                    </Link>
                </div>
            </header>

            {/* 2. HERO SECTION */}
            <section style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '6rem 2rem',
                minHeight: '70vh',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: 'clamp(4rem, 12vw, 10rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.06em',
                    lineHeight: 0.8,
                    background: 'linear-gradient(to bottom, var(--text-primary) 30%, transparent 120%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    opacity: 0.9,
                    userSelect: 'none',
                    position: 'relative',
                    marginBottom: '2rem'
                }}>
                    AXIOM
                    <span style={{
                        color: 'var(--color-trust)',
                        WebkitTextFillColor: 'var(--color-trust)',
                        textShadow: '0 0 60px rgba(45, 212, 191, 0.4)'
                    }}>
                        AI
                    </span>
                </div>

                <h1 style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '1.5rem', maxWidth: '800px' }}>
                    Advanced AI Research Copilot Built on Verification
                </h1>

                <div className="mono" style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                    <p>
                        Enterprise intelligence platform for technical research. 
                        Generate answers exclusively from mathematically vetted context vectors.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/signup" className="mono" style={{
                        padding: '0.875rem 2rem',
                        background: 'var(--color-trust)',
                        color: '#000',
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontWeight: 600
                    }}>
                        GET STARTED →
                    </Link>
                    <a href="#features" className="mono" style={{
                        padding: '0.875rem 2rem',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px'
                    }}>
                        VIEW FEATURES
                    </a>
                </div>
            </section>

            {/* 3. HOW IT WORKS */}
            <section style={{ padding: '6rem 2rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div className="mono" style={{ color: 'var(--color-trust)', fontSize: '0.85rem', marginBottom: '1rem' }}>// SYSTEM_FLOW</div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '3rem' }}>How Our Platform Works</h2>
                    
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                        gap: '2rem' 
                    }}>
                        {[
                            { step: '01', title: 'Upload Research', desc: 'Ingest complex PDF papers.' },
                            { step: '02', title: 'AI Indexes', desc: 'Semantic chunking & vectorization.' },
                            { step: '03', title: 'Ask Questions', desc: 'Query against absolute context.' },
                            { step: '04', title: 'Get Insights', desc: 'Verified, hallucinaton-free answers.' }
                        ].map((item, idx) => (
                            <div key={idx} className="glass-panel" style={{ 
                                padding: '1.5rem', 
                                borderLeft: '3px solid var(--border-subtle)',
                                transition: 'border-color 0.3s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderLeftColor = 'var(--color-trust)'}
                            onMouseOut={(e) => e.currentTarget.style.borderLeftColor = 'var(--border-subtle)'}>
                                <div className="mono" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>[{item.step}]</div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. CORE FEATURES GRID */}
            <section id="features" style={{ padding: '6rem 2rem' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div className="mono" style={{ color: 'var(--color-trust)', fontSize: '0.85rem', marginBottom: '1rem' }}>// CAPABILITIES</div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '3rem' }}>Core Intelligence Features</h2>
                    
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                        gap: '1.5rem' 
                    }}>
                        {[
                            { title: 'Research Chat Copilot', desc: 'Interactive chat locked to your uploaded documents boundaries.' },
                            { title: 'Visual Mindmap Generator', desc: 'Auto-generate concept maps outlining paper architectures.' },
                            { title: 'Research Gap Finder', desc: 'Identify omitted paradigms and future work opportunities.' },
                            { title: 'Multi-Paper Comparison', desc: 'Cross-reference methodologies across dozens of uploads seamlessly.' },
                            { title: 'Audio Explanation Mode', desc: 'Neural TTS generation for hands-free paper consumption.' },
                            { title: 'Trend Intelligence Engine', desc: 'Extract chronological advancements through metadata awareness.' }
                        ].map((feat, idx) => (
                            <div key={idx} className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    backgroundColor: 'var(--bg-secondary)', 
                                    border: '1px solid var(--border-subtle)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '4px',
                                    marginBottom: '1rem'
                                }}>
                                    <span style={{ color: 'var(--color-trust)' }}>❖</span>
                                </div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{feat.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                    {feat.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. ADVANTAGES STRIP */}
            <section style={{ padding: '4rem 2rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="mono" style={{ color: 'var(--text-muted)' }}>WHY_AXIOM_AI</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {['10x Faster Literature Review', 'Deep Technical Understanding', 'Innovation Opportunity Detection', 'Unified Research Workspace'].map((advantage, i) => (
                            <div key={i} style={{ 
                                padding: '1rem', 
                                border: '1px solid var(--color-trust-dim)', 
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                backgroundColor: 'rgba(45, 212, 191, 0.05)'
                            }}>
                                <span style={{ color: 'var(--color-trust)' }}>✓</span> {advantage}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. FAQ ACCORDION */}
            <section style={{ padding: '6rem 2rem' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="mono" style={{ color: 'var(--color-trust)', fontSize: '0.85rem', marginBottom: '1rem' }}>// QUERY_DATABASE</div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '3rem' }}>Frequently Asked Questions</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { q: 'What makes AXIOM AI different?', a: 'Standard LLMs hallucinate references. AXIOM relies entirely on an strict Retrieval-Augmented Generation pipeline. It only answers using the exact context you upload.' },
                            { q: 'Can it understand multiple papers?', a: 'Yes. Our semantic indexer handles numerous PDFs simultaneously, allowing cross-paper querying and synthesis.' },
                            { q: 'Is my research data secure?', a: 'All uploads are isolated to your workspace session via Row Level Security (RLS) in our Supabase backend. Vectors are siloed.' },
                            { q: 'Who should use this platform?', a: 'Academic researchers, corporate R&D teams, and technical analysts who cannot afford inaccuracies in their literature reviews.' }
                        ].map((faq, idx) => (
                            <div key={idx} className="glass-panel" style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
                                <button 
                                    onClick={() => toggleFaq(idx)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '1.25rem 1.5rem', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        background: 'var(--bg-primary)',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        textAlign: 'left'
                                    }}
                                >
                                    <span>{faq.q}</span>
                                    <span className="mono" style={{ color: 'var(--color-trust)' }}>
                                        {openFaq === idx ? '[-]' : '[+]'}
                                    </span>
                                </button>
                                {openFaq === idx && (
                                    <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. GET IN TOUCH */}
            <section style={{ padding: '6rem 2rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                    <div className="mono" style={{ color: 'var(--color-trust)', fontSize: '0.85rem', marginBottom: '1rem' }}>// COLLABORATE</div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ready to Escalate Your Research?</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                        Gain early access to enterprise capabilities and API integration.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <input 
                            type="email" 
                            placeholder="invest@domain.com"
                            className="mono glass-panel"
                            style={{
                                padding: '0.75rem 1rem',
                                width: '300px',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        />
                        <button className="mono" style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--color-trust)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}>
                            CONTACT_SALES
                        </button>
                    </div>
                </div>
            </section>

            {/* 8. FOOTER */}
            <footer style={{ 
                padding: '4rem 2rem 2rem 2rem', 
                backgroundColor: 'rgba(9, 9, 11, 0.95)', 
                borderTop: '1px solid var(--border-subtle)' 
            }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
                    
                    {/* Brand Column */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                            <img src="/logo.png" alt="AXIOMAI Logo" style={{ height: '20px', mixBlendMode: 'lighten' }} />
                            <span className="logo-text" style={{ fontSize: '1.1rem', fontWeight: 600 }}>AXIOMAI</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                            The trusted AI substrate for serious research intelligence and academic synthesis.
                        </p>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="mono" style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '1rem' }}>PRODUCT</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {['Copilot', 'Mindmaps', 'Enterprise', 'Pricing'].map(link => (
                                <a key={link} href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>{link}</a>
                            ))}
                        </div>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h4 className="mono" style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '1rem' }}>RESOURCES</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {['Documentation', 'API Reference', 'Research Blog', 'GitHub'].map(link => (
                                <a key={link} href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>{link}</a>
                            ))}
                        </div>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className="mono" style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '1rem' }}>LEGAL</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {['Privacy Policy', 'Terms of Service', 'Security Protocols'].map(link => (
                                <a key={link} href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>{link}</a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mono" style={{ 
                    maxWidth: '1000px', 
                    margin: '0 auto', 
                    paddingTop: '2rem', 
                    borderTop: '1px solid var(--border-subtle)', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem'
                }}>
                    <span>© 2026 AXIOM AI CORE. ALL RIGHTS RESERVED.</span>
                    <span style={{ color: 'var(--status-trusted)' }}>STATUS: OPERATIONAL</span>
                </div>
            </footer>
        </div>
    );
};

export default PublicHomePage;
