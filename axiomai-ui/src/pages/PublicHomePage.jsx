import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicHomePage = () => {
    const { session, loading } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [time, setTime] = useState('');
    const [counts, setCounts] = useState({ m0: 0, m1: 20, m2: 0, m3: '∞' });
    const countUpDone = useRef(false);
    const cursorGlowRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
            const progress = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            setScrollProgress(progress || 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toUTCString().slice(17, 25) + ' UTC');
        }, 1000);
        setTime(new Date().toUTCString().slice(17, 25) + ' UTC');
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (cursorGlowRef.current) {
                cursorGlowRef.current.style.left = (e.clientX - 150) + 'px';
                cursorGlowRef.current.style.top = (e.clientY - 150) + 'px';
            }
        };
        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.classList.contains('slide-from-left')) {
                        entry.target.classList.add('revealed');
                    } else if (entry.target.id === 'advantages-cards' && !countUpDone.current) {
                        countUpDone.current = true;
                        entry.target.style.opacity = '1';
                        entry.target.style.pointerEvents = 'auto';
                        entry.target.style.transform = 'translateY(0)';
                        
                        let m0_val = 0; let m1_val = 20; let m2_val = 0;
                        const i0 = setInterval(() => { m0_val += 1; setCounts(c => ({...c, m0: m0_val})); if (m0_val >= 10) clearInterval(i0); }, 1200 / 10);
                        const i1 = setInterval(() => { m1_val -= 1; setCounts(c => ({...c, m1: m1_val})); if (m1_val <= 0) clearInterval(i1); }, 1000 / 20);
                        const i2 = setInterval(() => { m2_val += 1; setCounts(c => ({...c, m2: m2_val})); if (m2_val >= 50) clearInterval(i2); }, 1400 / 50);
                    } else {
                        entry.target.style.opacity = '1';
                        entry.target.style.pointerEvents = 'auto';
                        entry.target.style.transform = 'translateY(0)';
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.scroll-reveal, .slide-from-left').forEach((el) => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }); // Run observer bind after every render to guarantee elements are caught
    
    const [openFaq, setOpenFaq] = useState(null);
    const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

    // Redirect logged-in users directly to dashboard
    if (!loading && session) {
        return <Navigate to="/dashboard/home" replace />;
    }

    if (loading) {
        return <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}></div>;
    }

    const axiomText = "AXIOM";
    const aiText = "AI";

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', overflowX: 'hidden', scrollBehavior: 'smooth' }}>
            <style>{`
                @media (prefers-reduced-motion: no-preference) {
                    .nav-enter { opacity: 0; animation: navEnter 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    .hero-subtitle-enter { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 700ms forwards; }
                    .hero-body-enter { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 900ms forwards; }
                    .hero-cta-enter { opacity: 0; animation: scaleUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1100ms forwards; }
                    
                    .letter-anim {
                        display: inline-block;
                        opacity: 0;
                        transform: translateY(40px);
                        animation: letterReveal 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }

                    .scroll-reveal {
                        opacity: 0;
                        transform: translateY(60px);
                        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .stagger-child-1 { transition-delay: 100ms; }
                    .stagger-child-2 { transition-delay: 200ms; }
                    .stagger-child-3 { transition-delay: 300ms; }
                    .stagger-child-4 { transition-delay: 400ms; }
                    .stagger-child-5 { transition-delay: 500ms; }
                    .stagger-child-6 { transition-delay: 600ms; }
                    
                    .slide-from-left {
                        opacity: 0;
                        transform: translateX(-30px) translateY(20px);
                        transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .slide-from-left.revealed {
                        opacity: 1;
                        transform: translateX(0) translateY(0);
                    }
                    
                    @keyframes navEnter {
                        from { opacity: 0; transform: translateY(-20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes letterReveal {
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes fadeUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes scaleUp {
                        from { opacity: 0; transform: scale(0.95); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    @keyframes gridPulse {
                        0%, 100% { opacity: 0.15; }
                        50% { opacity: 0.3; }
                    }
                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% { transform: translateY(0) translateX(-50%); }
                        40% { transform: translateY(-10px) translateX(-50%); }
                        60% { transform: translateY(-5px) translateX(-50%); }
                    }
                    @keyframes float1 {
                        0%, 100% { transform: translate(0, 0); }
                        50% { transform: translate(20px, -20px); }
                    }
                    @keyframes float2 {
                        0%, 100% { transform: translate(0, 0); }
                        50% { transform: translate(-20px, 20px); }
                    }
                    @keyframes bubbleIn { 
                        from { opacity:0; transform: translateY(8px); } 
                        to { opacity:1; transform:translateY(0); } 
                    }
                    @keyframes blink { 
                        0%,100%{opacity:1} 50%{opacity:0} 
                    }
                    @keyframes pulse { 
                        0%,100%{opacity:1} 50%{opacity:0.4} 
                    }
                    @keyframes marquee { 
                        from { transform: translateX(0); } 
                        to { transform: translateX(-50%); } 
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .nav-enter, .hero-subtitle-enter, .hero-body-enter, .hero-cta-enter, .letter-anim, .scroll-reveal {
                        opacity: 1 !important;
                        transform: none !important;
                        animation: none !important;
                        transition: none !important;
                    }
                }
                
                .hero-grid {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(to right, rgba(0, 255, 178, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0, 255, 178, 0.05) 1px, transparent 1px);
                    background-size: 40px 40px;
                    animation: gridPulse 8s ease-in-out infinite;
                    z-index: 0;
                    pointer-events: none;
                }
                .hero-glow {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 50vw;
                    height: 50vw;
                    background: radial-gradient(circle, rgba(0, 255, 178, 0.15) 0%, transparent 60%);
                    z-index: 0;
                    pointer-events: none;
                    filter: blur(60px);
                }
                .floating-particle {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(0, 255, 178, 0.3);
                    pointer-events: none;
                    z-index: 0;
                }
                .scroll-indicator {
                    position: absolute;
                    bottom: 2rem;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    opacity: 1;
                    transition: opacity 0.3s;
                    z-index: 10;
                    animation: bounce 2s infinite;
                }
                .scroll-indicator.hidden { opacity: 0; pointer-events: none; }
                .chevron {
                    width: 16px;
                    height: 16px;
                    border-right: 2px solid var(--color-trust);
                    border-bottom: 2px solid var(--color-trust);
                    transform: rotate(45deg);
                }
                
                .btn-primary {
                    transition: box-shadow 0.3s ease, transform 0.3s ease !important;
                }
                .btn-primary:hover {
                    box-shadow: 0 0 24px rgba(0, 255, 178, 0.5) !important;
                    transform: scale(1.03) !important;
                }
                .btn-outline {
                    transition: background-color 0.3s ease, color 0.3s ease !important;
                }
                .btn-outline:hover {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                }
                .navbar-glass {
                    transition: background-color 0.4s ease, backdrop-filter 0.4s ease, border-bottom 0.4s ease;
                }
                .marquee-track { 
                    display: flex; width: max-content; animation: marquee 25s linear infinite; 
                }
                .marquee-track:hover { animation-play-state: paused; }
                .faq-layout { display: grid; grid-template-columns: 35% 1fr; gap: 4rem; align-items: start; }
                .glass-panel { backdrop-filter: blur(4px); }
                h1, h2, h3 { letter-spacing: -0.02em; }
                h2 { font-size: clamp(1.5rem, 3vw, 2rem); }
                @media (max-width: 768px) {
                    .flow-connector { display: none !important; }
                    .faq-layout { grid-template-columns: 1fr; } 
                    .faq-sticky { display: none; }
                }
            `}</style>
            
            <div ref={cursorGlowRef} style={{
                position: 'fixed', width: '300px', height: '300px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,255,178,0.04) 0%, transparent 70%)',
                pointerEvents: 'none', zIndex: 0, transition: 'left 0.15s ease, top 0.15s ease'
            }} />
            
            <div style={{ 
                position: 'fixed', top: 0, left: 0, height: '3px', width: scrollProgress + '%', 
                background: 'linear-gradient(to right, var(--color-trust), rgba(0,255,178,0.5))', 
                zIndex: 100, transition: 'width 0.1s linear', pointerEvents: 'none' 
            }} />

            {/* 1. NAVIGATION HEADER */}
            <header className="glass-panel nav-enter navbar-glass" style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '1rem 2rem', 
                borderBottom: isScrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
                backgroundColor: isScrolled ? 'rgba(10, 14, 15, 0.95)' : 'transparent',
                backdropFilter: isScrolled ? 'blur(12px)' : 'none'
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
                position: 'relative',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '6rem 2rem',
                height: '100vh',
                minHeight: '100vh',
                textAlign: 'center',
                overflow: 'hidden'
            }}>
                <div className="hero-grid"></div>
                <div className="hero-glow"></div>
                <div className="floating-particle" style={{ width: '6px', height: '6px', top: '20%', left: '20%', animation: 'float1 8s infinite ease-in-out' }}></div>
                <div className="floating-particle" style={{ width: '4px', height: '4px', top: '70%', left: '80%', animation: 'float2 12s infinite ease-in-out' }}></div>
                <div className="floating-particle" style={{ width: '8px', height: '8px', top: '40%', left: '75%', animation: 'float1 15s infinite ease-in-out' }}></div>
                <div className="floating-particle" style={{ width: '3px', height: '3px', top: '60%', left: '25%', animation: 'float2 10s infinite ease-in-out' }}></div>

                <div style={{
                    fontSize: 'clamp(4rem, 12vw, 10rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.06em',
                    lineHeight: 0.8,
                    opacity: 0.9,
                    userSelect: 'none',
                    position: 'relative',
                    marginBottom: '2rem',
                    zIndex: 1
                }}>
                    {axiomText.split('').map((letter, idx) => (
                        <span key={`axiom-${idx}`} className="letter-anim" style={{ animationDelay: `${idx * 60}ms` }}>
                            <span style={{
                                background: 'linear-gradient(to bottom, var(--text-primary) 30%, transparent 120%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                display: 'inline-block'
                            }}>
                                {letter}
                            </span>
                        </span>
                    ))}
                    <span style={{
                        color: 'var(--color-trust)',
                        WebkitTextFillColor: 'var(--color-trust)',
                        textShadow: '0 0 60px rgba(45, 212, 191, 0.4)'
                    }}>
                        {aiText.split('').map((letter, idx) => (
                            <span key={`ai-${idx}`} className="letter-anim" style={{ animationDelay: `${(axiomText.length + idx) * 60}ms` }}>
                                {letter}
                            </span>
                        ))}
                    </span>
                </div>

                <h1 className="hero-subtitle-enter" style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '1.5rem', maxWidth: '800px', zIndex: 1, position: 'relative' }}>
                    Advanced AI Research Copilot Built on Verification
                </h1>

                <div className="mono hero-body-enter" style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2.5rem', zIndex: 1, position: 'relative' }}>
                    <p>
                        Enterprise intelligence platform for technical research. 
                        Generate answers exclusively from mathematically vetted context vectors.
                    </p>
                </div>

                <div className="hero-cta-enter" style={{ display: 'flex', gap: '1rem', zIndex: 1, position: 'relative' }}>
                    <Link to="/signup" className="mono btn-primary" style={{
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
                    <a href="#features" className="mono btn-outline" style={{
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
                
                <div className={`scroll-indicator ${isScrolled ? 'hidden' : ''}`}>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-trust)', opacity: 0.8 }}>SCROLL</span>
                    <div className="chevron"></div>
                </div>
            </section>

            {/* 3. HOW IT WORKS */}
            <section className="scroll-reveal" style={{ padding: '6rem 2rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div className="mono scroll-reveal stagger-child-1" style={{ color: 'var(--color-trust)', fontSize: '0.85rem', marginBottom: '1rem' }}>// SYSTEM_FLOW</div>
                    <h2 className="scroll-reveal stagger-child-1" style={{ fontSize: '2rem', marginBottom: '0' }}>How Our Platform Works</h2>
                    
                    <div className="mono scroll-reveal stagger-child-2" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                        A four-stage pipeline that eliminates hallucination at every layer.
                    </div>
                    <div className="scroll-reveal stagger-child-2" style={{ background: 'var(--color-trust)', opacity: 0.6, width: '40px', height: '2px', marginBottom: '3rem' }}></div>
                    
                    <div style={{ position: 'relative' }}>
                        <div className="flow-connector" style={{
                            position: 'absolute',
                            top: '2.5rem',
                            left: '5%',
                            right: '5%',
                            height: '1px',
                            background: 'linear-gradient(to right, transparent, rgba(0,255,178,0.2) 20%, rgba(0,255,178,0.2) 80%, transparent)',
                            borderTop: '1px dashed rgba(0,255,178,0.3)',
                            zIndex: 0,
                            pointerEvents: 'none'
                        }}></div>
                        
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
                                <div key={idx} className={`glass-panel scroll-reveal stagger-child-${idx + 3}`} style={{ 
                                    padding: '1.5rem', 
                                    borderLeft: '3px solid var(--border-subtle)',
                                    position: 'relative',
                                    zIndex: 1,
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderLeftColor = 'var(--color-trust)';
                                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,178,0.08)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderLeftColor = 'var(--border-subtle)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}>
                                    <div className="mono" style={{ 
                                        display: 'inline-block',
                                        padding: '0.25rem 0.6rem',
                                        border: '1px solid rgba(0,255,178,0.4)',
                                        borderRadius: '3px',
                                        background: 'rgba(0,255,178,0.06)',
                                        color: 'var(--color-trust)',
                                        fontSize: '0.75rem',
                                        textShadow: '0 0 8px rgba(0,255,178,0.5)',
                                        marginBottom: '1.25rem'
                                    }}>
                                        [{item.step}]
                                    </div>
                                    <span style={{ fontSize: '1.25rem', color: 'var(--color-trust)', marginBottom: '0.5rem', display: 'block', opacity: 0.8 }}>
                                        {['↑', '◈', '◎', '✦'][idx]}
                                    </span>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. CORE FEATURES GRID */}
            <section id="features" style={{ padding: '6rem 2rem' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div className="mono scroll-reveal stagger-child-1" style={{ color: 'var(--color-trust)', fontSize: '0.85rem', marginBottom: '1rem' }}>// CAPABILITIES</div>
                    
                    <div className="scroll-reveal stagger-child-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Core Intelligence Features</h2>
                            <div className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                Six specialized modules. Zero hallucination tolerance.
                            </div>
                        </div>
                        <div className="mono" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', border: '1px solid var(--border-subtle)', borderRadius: '3px', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginBottom: '0.2rem' }}>
                            06 MODULES
                        </div>
                    </div>
                    
                    <div className="scroll-reveal stagger-child-2" style={{ 
                        height: '1px', 
                        background: 'linear-gradient(to right, rgba(0,255,178,0.3), transparent)', 
                        marginTop: '1.5rem',
                        marginBottom: '3rem' 
                    }}></div>
                    
                    <div className="bento-grid-container" style={{ 
                        display: 'grid', 
                        gap: '1.5rem'
                    }}>
                        <style>{`
                            .bento-grid-container {
                                grid-template-columns: 2fr 3fr;
                                grid-template-rows: auto;
                            }
                            .bento-right-col {
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 1.5rem;
                            }
                            @media (max-width: 768px) {
                                .bento-grid-container {
                                    grid-template-columns: 1fr;
                                }
                                .bento-right-col {
                                    grid-template-columns: 1fr;
                                }
                                .bento-span-2 {
                                    grid-column: span 1 !important;
                                }
                            }
                        `}</style>
                        
                        <div className="glass-panel slide-from-left stagger-child-3" style={{ 
                            gridRow: 'span 2',
                            padding: '2rem 1.5rem',
                            backgroundColor: 'var(--bg-secondary)',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'box-shadow 0.4s ease, opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 30px rgba(0,255,178,0.12)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'radial-gradient(circle at 30% 70%, rgba(0,255,178,0.08) 0%, transparent 60%)',
                                pointerEvents: 'none'
                            }}></div>
                            
                            <div style={{
                                display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem',
                                padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px',
                                border: '1px solid var(--border-subtle)', position: 'relative', zIndex: 1
                            }}>
                                <div className="bubble-1" style={{
                                    background: 'rgba(0,255,178,0.15)', border: '1px solid rgba(0,255,178,0.3)',
                                    borderRadius: '8px 8px 2px 8px', padding: '0.5rem 0.75rem', fontSize: '0.75rem',
                                    color: 'var(--text-primary)', alignSelf: 'flex-end', maxWidth: '80%'
                                }}>
                                    Summarize the methodology section
                                </div>
                                <div className="bubble-2" style={{
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
                                    borderRadius: '8px 8px 8px 2px', padding: '0.5rem 0.75rem', fontSize: '0.75rem',
                                    color: 'var(--text-secondary)', maxWidth: '85%'
                                }}>
                                    Based on your uploaded paper, the methodology uses...
                                </div>
                                <div className="bubble-3" style={{
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
                                    borderRadius: '8px 8px 8px 2px', padding: '0.5rem 0.75rem', fontSize: '0.7rem',
                                    color: 'var(--color-trust)', maxWidth: '85%'
                                }}>
                                    ✓ Verified from context — no hallucination detected
                                </div>
                                
                                <div style={{
                                    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)',
                                    borderRadius: '4px', padding: '0.4rem 0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)',
                                    marginTop: '0.5rem'
                                }}>
                                    Ask anything about your research... <span className="cursor">|</span>
                                </div>
                            </div>
                            
                            <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto' }}>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Research Chat Copilot</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                    Interactive chat locked to your uploaded documents boundaries.
                                </p>
                                <div className="mono" style={{ 
                                    fontSize: '0.7rem', color: 'var(--color-trust)', display: 'inline-flex', 
                                    alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem' 
                                }}>
                                    <span style={{ animation: 'pulse 2s infinite' }}>●</span> LIVE CONTEXT LOCKED
                                </div>
                            </div>
                        </div>

                        <div className="bento-right-col">
                            {[
                                { title: 'Visual Mindmap Generator', desc: 'Auto-generate concept maps outlining paper architectures.', icon: '◉', tag: null, stat: 'Generates in < 3s', delay: 3 },
                                { title: 'Research Gap Finder', desc: 'Identify omitted paradigms and future work opportunities.', icon: '⊗', tag: null, stat: 'Scans 100+ paradigms', delay: 4 },
                                { title: 'Multi-Paper Comparison', desc: 'Cross-reference methodologies across dozens of uploads seamlessly.', icon: '⇌', tag: null, stat: 'Up to 50 papers', delay: 4 },
                                { title: 'Audio Explanation Mode', desc: 'Neural TTS generation for hands-free paper consumption.', icon: '◎', tag: 'BETA', stat: 'Neural TTS · 12 voices', delay: 5 },
                                { title: 'Trend Intelligence Engine', desc: 'Extract chronological advancements through metadata awareness.', icon: '↗', tag: 'NEW', stat: 'Decade-span analysis', delay: 5, spanTw: true }
                            ].map((feat, idx) => (
                                <div key={idx} className={`glass-panel scroll-reveal stagger-child-${feat.delay} ${feat.spanTw ? 'bento-span-2' : ''}`} style={{ 
                                    padding: '1.5rem', 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gridColumn: feat.spanTw ? 'span 2' : 'auto',
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)' 
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.borderColor = 'rgba(0,255,178,0.3)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                                    const iconBox = e.currentTarget.querySelector('.icon-box');
                                    if (iconBox) iconBox.style.background = 'rgba(0,255,178,0.15)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    const iconBox = e.currentTarget.querySelector('.icon-box');
                                    if (iconBox) iconBox.style.background = 'rgba(0,255,178,0.08)';
                                }}>
                                    <div className="icon-box" style={{ 
                                        width: '36px', height: '36px', background: 'rgba(0,255,178,0.08)', 
                                        border: '1px solid rgba(0,255,178,0.25)', borderRadius: '4px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1rem', color: 'var(--color-trust)', marginBottom: '0.75rem',
                                        transition: 'background 0.3s ease'
                                    }}>
                                        {feat.icon}
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                        {feat.title}
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                        {feat.desc}
                                    </p>
                                    
                                    {feat.tag && (
                                        <div style={{ marginTop: '0.2rem', marginBottom: '0.5rem' }}>
                                            <span className="mono" style={{
                                                fontSize: '0.65rem', padding: '0.15rem 0.4rem',
                                                border: '1px solid rgba(0,255,178,0.4)', borderRadius: '2px',
                                                color: 'var(--color-trust)', background: 'rgba(0,255,178,0.06)',
                                                display: 'inline-block'
                                            }}>
                                                {feat.tag}
                                            </span>
                                        </div>
                                    )}

                                    <div className="mono" style={{
                                        fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 'auto',
                                        paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)'
                                    }}>
                                        {feat.stat}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. ADVANTAGES STRIP */}
            <section id="advantages-cards" className="scroll-reveal" style={{ 
                padding: '4rem 0', 
                backgroundColor: 'var(--bg-secondary)', 
                borderTop: '1px solid var(--border-subtle)', 
                borderBottom: '1px solid var(--border-subtle)' 
            }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', padding: '0 2rem' }}>
                    <div className="mono scroll-reveal stagger-child-1" style={{ color: 'var(--text-muted)' }}>WHY_AXIOM_AI</div>
                </div>

                <div className="scroll-reveal stagger-child-2" style={{
                    overflow: 'hidden', padding: '1rem 0',
                    borderTop: '1px solid var(--border-subtle)',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginTop: '1.5rem', marginBottom: '3rem',
                    background: 'rgba(0,255,178,0.02)'
                }}>
                    <div className="marquee-track">
                        {[1, 2].map((group) => (
                            <div key={group} style={{ display: 'flex' }}>
                                {[
                                    "◈ 10x Faster Reviews", 
                                    "◉ 50+ Papers Simultaneously", 
                                    "✦ 0% Hallucination Rate", 
                                    "↗ 100+ Paradigms Scanned", 
                                    "◎ 12 Neural Voices", 
                                    "⇌ Decade-Span Analysis", 
                                    "◈ RAG-Verified Every Answer", 
                                    "✦ Enterprise RLS Security"
                                ].map((stat, idx) => (
                                    <span key={idx} className="mono" style={{ 
                                        fontSize: '0.8rem', color: 'var(--text-muted)', 
                                        whiteSpace: 'nowrap', padding: '0 3rem', display: 'flex', alignItems: 'center'
                                    }}>
                                        {stat}
                                        <span style={{ color: 'var(--color-trust)', marginLeft: '6rem' }}>·</span>
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        {[
                            { metric: counts.m0 + 'x', label: 'Faster Literature Review', icon: '◈', desc: 'vs manual search baseline', delay: 3 },
                            { metric: counts.m1 + '%', label: 'Hallucination Rate', icon: '✦', desc: 'RAG-enforced context lock', delay: 4 },
                            { metric: counts.m2 + '+', label: 'Papers Simultaneously', icon: '⇌', desc: 'cross-referenced in real-time', delay: 4 },
                            { metric: counts.m3, label: 'Research Continuity', icon: '◉', desc: 'persistent session workspace', delay: 5 }
                        ].map((card, i) => (
                            <div key={i} className={`glass-panel scroll-reveal stagger-child-${card.delay}`} style={{ 
                                padding: '1.5rem', 
                                borderTop: '2px solid rgba(0,255,178,0.2)', 
                                borderRadius: '4px',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.borderTopColor = 'var(--color-trust)';
                                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderTopColor = 'rgba(0,255,178,0.2)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}>
                                <div style={{ 
                                    width: '32px', height: '32px', background: 'rgba(0,255,178,0.08)', 
                                    border: '1px solid rgba(0,255,178,0.25)', borderRadius: '4px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.9rem', color: 'var(--color-trust)', marginBottom: '1.5rem'
                                }}>
                                    {card.icon}
                                </div>
                                <div className="mono" style={{ 
                                    fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, 
                                    color: 'var(--color-trust)', letterSpacing: '-0.04em',
                                    textShadow: '0 0 20px rgba(0,255,178,0.3)', marginBottom: '0.5rem'
                                }}>
                                    {card.metric}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                                    {card.label}
                                </div>
                                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    {card.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. FAQ ACCORDION */}
            <section className="scroll-reveal" style={{ padding: '6rem 2rem' }}>
                <div className="faq-layout" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    
                    {/* Left Sticky Panel */}
                    <div className="faq-sticky scroll-reveal stagger-child-1" style={{ position: 'sticky', top: '6rem' }}>
                        <div className="mono" style={{ color: 'var(--color-trust)', fontSize: '0.85rem', marginBottom: '1rem' }}>// QUERY_DATABASE</div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Frequently Asked Questions</h2>
                        <div className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '3rem' }}>
                            Everything you need to know before trusting us with your research.
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                                Still have questions?
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '0.5rem' }}>
                                Our team responds within 2 hours for enterprise inquiries.
                            </div>
                            <div style={{ height: '1px', background: 'var(--color-trust)', opacity: 0.3, margin: '1.5rem 0' }}></div>
                            
                            <a href="#" className="mono" style={{
                                display: 'block', fontSize: '0.8rem', color: 'var(--color-trust)',
                                padding: '0.75rem 1rem', border: '1px solid rgba(0,255,178,0.3)', borderRadius: '4px',
                                textDecoration: 'none', textAlign: 'center', marginTop: '1rem',
                                transition: 'background 0.3s, box-shadow 0.3s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(0,255,178,0.08)';
                                e.currentTarget.style.boxShadow = '0 0 16px rgba(0,255,178,0.1)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.boxShadow = 'none';
                            }}>
                                CONTACT SUPPORT →
                            </a>
                            
                            <div className="mono" style={{
                                fontSize: '0.7rem', color: 'var(--color-trust)', display: 'flex', 
                                alignItems: 'center', gap: '0.4rem', marginTop: '1.5rem'
                            }}>
                                <span style={{ animation: 'pulse 2s infinite' }}>●</span> SYSTEM STATUS: OPERATIONAL
                            </div>
                        </div>
                    </div>

                    {/* Right Accordion */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Mobile Header (only shows on mobile) */}
                        <div className="mobile-only" style={{ marginBottom: '2rem' }}>
                            <style>{`
                                .mobile-only { display: none; }
                                @media (max-width: 768px) { .mobile-only { display: block; } }
                            `}</style>
                            <div className="mono scroll-reveal stagger-child-1" style={{ color: 'var(--color-trust)', fontSize: '0.85rem', marginBottom: '1rem' }}>// QUERY_DATABASE</div>
                            <h2 className="scroll-reveal stagger-child-2" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Frequently Asked Questions</h2>
                        </div>

                        {[
                            { q: 'What makes AXIOM AI different?', a: 'Standard LLMs hallucinate references. AXIOM relies entirely on an strict Retrieval-Augmented Generation pipeline. It only answers using the exact context you upload.' },
                            { q: 'Can it understand multiple papers?', a: 'Yes. Our semantic indexer handles numerous PDFs simultaneously, allowing cross-paper querying and synthesis.' },
                            { q: 'Is my research data secure?', a: 'All uploads are isolated to your workspace session via Row Level Security (RLS) in our Supabase backend. Vectors are siloed.' },
                            { q: 'Is there a free tier available?', a: 'Yes. AXIOM AI offers a free research tier with up to 5 paper uploads and 50 queries per month. Enterprise plans unlock unlimited ingestion, API access, and team collaboration.' },
                            { q: 'Who should use this platform?', a: 'Academic researchers, corporate R&D teams, and technical analysts who cannot afford inaccuracies in their literature reviews.' }
                        ].map((faq, idx) => (
                            <div key={idx} className={`glass-panel scroll-reveal stagger-child-${(idx % 4) + 3}`} style={{ 
                                border: '1px solid var(--border-subtle)', 
                                borderRadius: '6px', 
                                overflow: 'hidden', 
                                borderLeft: openFaq === idx ? '3px solid var(--color-trust)' : '3px solid transparent',
                                transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), border-left 0.3s ease' 
                            }}>
                                <button 
                                    onClick={() => toggleFaq(idx)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '1.25rem 1.5rem', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        background: openFaq === idx ? 'rgba(0,255,178,0.04)' : 'var(--bg-primary)',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        textAlign: 'left',
                                        transition: 'background 0.3s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '1rem' }}>
                                            0{idx + 1}
                                        </span>
                                        <span>{faq.q}</span>
                                    </div>
                                    <span className="mono" style={{ color: 'var(--color-trust)' }}>
                                        {openFaq === idx ? '[-]' : '[+]'}
                                    </span>
                                </button>
                                <div style={{ 
                                    maxHeight: openFaq === idx ? '500px' : '0px',
                                    overflow: 'hidden',
                                    transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                                    opacity: openFaq === idx ? 1 : 0,
                                    padding: openFaq === idx ? '0 1.5rem 1.25rem 1.5rem' : '0 1.5rem'
                                }}>
                                    <div style={{
                                        color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, 
                                        borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' 
                                    }}>
                                        {faq.a}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. GET IN TOUCH */}
            <section className="scroll-reveal" style={{ padding: '6rem 2rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', top: '-50%', left: '-20%', width: '600px', height: '600px',
                    background: 'radial-gradient(circle, rgba(0,255,178,0.06) 0%, transparent 60%)',
                    borderRadius: '50%', pointerEvents: 'none', zIndex: 0
                }}></div>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(to right, rgba(0,255,178,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,255,178,0.03) 1px, transparent 1px)',
                    backgroundSize: '60px 60px', pointerEvents: 'none', zIndex: 0
                }}></div>
                
                <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                    <div className="mono scroll-reveal stagger-child-1" style={{ color: 'var(--color-trust)', fontSize: '0.85rem', marginBottom: '1rem' }}>// COLLABORATE</div>
                    <span className="scroll-reveal stagger-child-1" style={{ fontSize: '2rem', color: 'var(--color-trust)', opacity: 0.6, display: 'block', marginBottom: '1rem' }}>◈</span>
                    <h2 className="scroll-reveal stagger-child-2" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Ready to Escalate Your Research?</h2>
                    
                    <div className="scroll-reveal stagger-child-3" style={{ marginBottom: '2.5rem' }}>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Gain early access to enterprise capabilities and API integration.</p>
                        <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>No credit card required. Cancel anytime.</p>
                    </div>
                    
                    <div className="mono scroll-reveal stagger-child-3" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        {['✓ SOC 2 Compliant', '✓ End-to-End Encrypted', '✓ No Data Training'].map((badge, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span style={{ color: 'var(--color-trust)' }}>{badge.charAt(0)}</span> {badge.slice(1).trim()}
                            </div>
                        ))}
                    </div>
                    
                    <div className="scroll-reveal stagger-child-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                        <input 
                            type="email" 
                            placeholder="invest@domain.com"
                            className="mono glass-panel"
                            style={{
                                padding: '0.75rem 1rem', width: '300px', background: 'var(--bg-primary)',
                                color: 'var(--text-primary)', outline: 'none', border: '1px solid var(--border-subtle)',
                                transition: 'border-color 0.3s', borderRadius: '4px'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-trust)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                        />
                        <button className="mono btn-primary" style={{
                            padding: '0.75rem 1.5rem', background: 'var(--color-trust)', color: '#000',
                            border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer'
                        }}>
                            CONTACT_SALES
                        </button>
                    </div>
                    <div className="mono scroll-reveal stagger-child-5" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
                        We respect your privacy. Unsubscribe at any time.
                    </div>
                    
                    <div className="scroll-reveal stagger-child-5" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0', marginTop: '1.5rem' }}>
                        {['R', 'A', 'K', 'S', 'M'].map((letter, idx) => (
                            <div key={idx} style={{ 
                                width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--bg-secondary)',
                                background: ['rgba(0,255,178,0.3)', 'rgba(0,200,150,0.4)', 'rgba(0,180,130,0.3)', 'rgba(0,255,178,0.2)', 'rgba(45,212,191,0.35)'][idx],
                                marginLeft: idx !== 0 ? '-8px' : '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.6rem', color: 'var(--color-trust)'
                            }}>
                                {letter}
                            </div>
                        ))}
                        <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.75rem' }}>
                            Join 500+ researchers
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. FOOTER */}
            <footer className="scroll-reveal" style={{ 
                padding: '0 0 2rem 0', 
                backgroundColor: 'rgba(9, 9, 11, 0.95)'
            }}>
                <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(0,255,178,0.4) 30%, rgba(0,255,178,0.4) 70%, transparent)', marginBottom: '4rem' }}></div>
                
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '4rem', padding: '0 2rem' }}>
                    
                    {/* Brand Column */}
                    <div className="scroll-reveal stagger-child-1">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                            <img src="/logo.png" alt="AXIOMAI Logo" style={{ height: '20px', mixBlendMode: 'lighten' }} />
                            <span className="logo-text" style={{ fontSize: '1.1rem', fontWeight: 600 }}>AXIOMAI</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                            The trusted AI substrate for serious research intelligence and academic synthesis.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                            {['GH', '𝕏', 'IN'].map((social, i) => (
                                <a key={i} href="#" style={{ 
                                    width: '32px', height: '32px', border: '1px solid var(--border-subtle)', borderRadius: '4px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'mono', textDecoration: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-trust)';
                                    e.currentTarget.style.color = 'var(--color-trust)';
                                    e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,178,0.15)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}>
                                    {social}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div className="scroll-reveal stagger-child-2">
                        <h4 className="mono" style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '1rem' }}>PRODUCT</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {['Copilot', 'Mindmaps', 'Enterprise', 'Pricing'].map(link => (
                                <a key={link} href="#" 
                                   style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s ease' }}
                                   onMouseOver={(e) => e.target.style.color = 'var(--color-trust)'} 
                                   onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
                                    {link}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Resources Links */}
                    <div className="scroll-reveal stagger-child-3">
                        <h4 className="mono" style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '1rem' }}>RESOURCES</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {['Documentation', 'API Reference', 'Research Blog', 'GitHub'].map(link => (
                                <a key={link} href="#" 
                                   style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s ease' }}
                                   onMouseOver={(e) => e.target.style.color = 'var(--color-trust)'} 
                                   onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
                                    {link}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Legal Links */}
                    <div className="scroll-reveal stagger-child-4">
                        <h4 className="mono" style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '1rem' }}>LEGAL</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {['Privacy Policy', 'Terms of Service', 'Security Protocols'].map(link => (
                                <a key={link} href="#" 
                                   style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s ease' }}
                                   onMouseOver={(e) => e.target.style.color = 'var(--color-trust)'} 
                                   onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
                                    {link}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mono scroll-reveal stagger-child-5" style={{ 
                    maxWidth: '1000px', 
                    margin: '0 auto', 
                    padding: '2rem 2rem 0 2rem', 
                    borderTop: '1px solid var(--border-subtle)', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem'
                }}>
                    <span>© 2026 AXIOM AI CORE. ALL RIGHTS RESERVED.</span>
                    <span style={{ color: 'var(--text-muted)' }}>SYS_TIME: {time}</span>
                    <span style={{ color: 'var(--status-trusted, var(--color-trust))' }}>STATUS: OPERATIONAL</span>
                </div>
            </footer>
        </div>
    );
};

export default PublicHomePage;
