import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../index.css';
import './components.css';

const Layout = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login', { replace: true });
    };

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="app-layer">
            <header className="nav-header">
                <div className="logo-group">
                    <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* We use mix-blend-mode to drop black background if any */}
                        <img src="/logo.png" alt="AXIOMAI Logo" style={{ height: '24px', mixBlendMode: 'lighten' }} />
                        <span className="logo-text" style={{ color: 'var(--text-primary)', fontSize: '1.25rem' }}>AXIOMAI</span>
                    </NavLink>
                </div>

                <nav className="nav-links mono">
                    <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end> HOME</NavLink>
                    <NavLink to="/dashboard/copilot" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}> COPILOT</NavLink>
                    <NavLink to="/dashboard/compare" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}> COMPARE</NavLink>
                    <NavLink to="/dashboard/ideas" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}> IDEAS</NavLink>
                </nav>

                <div className="nav-user-badge" ref={dropdownRef} style={{ position: 'relative' }}>
                    <button 
                        onClick={() => setDropdownOpen(!dropdownOpen)} 
                        style={{ 
                            background: dropdownOpen ? 'var(--input-bg)' : 'transparent', 
                            border: '1px solid var(--border-subtle)', 
                            borderRadius: '50%',
                            padding: '0.5rem',
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s ease',
                            boxShadow: dropdownOpen ? '0 0 10px var(--color-intelligence-dim)' : 'none'
                        }}
                        title="User Menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </button>

                    {dropdownOpen && (
                        <div className="glass-panel" style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            right: 0, 
                            marginTop: '0.75rem', 
                            minWidth: '180px', 
                            padding: '0.5rem',
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '0.25rem',
                            zIndex: 100
                        }}>
                            <NavLink 
                                to="/dashboard/profile" 
                                className="mono" 
                                style={{ 
                                    padding: '0.75rem 1rem', 
                                    textDecoration: 'none', 
                                    color: 'var(--text-primary)', 
                                    textAlign: 'left', 
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    transition: 'background 0.2s',
                                    background: 'transparent'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'var(--input-bg)';
                                    e.currentTarget.style.color = 'var(--color-intelligence)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }}
                                onClick={() => setDropdownOpen(false)}
                            >
                                PROFILE
                            </NavLink>
                            <button 
                                onClick={() => { setDropdownOpen(false); handleLogout(); }} 
                                className="mono" 
                                style={{ 
                                    padding: '0.75rem 1rem', 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: 'var(--status-risk)', 
                                    textAlign: 'left', 
                                    cursor: 'pointer', 
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    transition: 'background 0.2s',
                                    fontWeight: 'bold'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'var(--input-bg)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                LOGOUT
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="page-container animate-fade-in">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
