import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import '../index.css';

const Layout = () => {
    return (
        <div className="app-layer">
            <header className="nav-header">
                <div className="logo-group">
                    <NavLink to="/home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* We use mix-blend-mode to drop black background if any */}
                        <img src="/logo.png" alt="AXIOMAI Logo" style={{ height: '24px', mixBlendMode: 'lighten' }} />
                        <span className="logo-text" style={{ color: 'var(--text-primary)', fontSize: '1.25rem' }}>AXIOMAI</span>
                    </NavLink>
                </div>

                <nav className="nav-links mono">
                    <NavLink to="/home" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>[00] HOME</NavLink>
                    <NavLink to="/query" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>[01] QUERY</NavLink>
                    <NavLink to="/system" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>[02] SYSTEM</NavLink>
                    <NavLink to="/trust" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>[03] TRUST</NavLink>
                    <NavLink to="/copilot" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>[04] COPILOT</NavLink>
                </nav>

                <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{ width: 6, height: 6, background: 'var(--status-trusted)', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px var(--status-trusted)' }}></span>
                    SYS_ONLINE
                </div>
            </header>

            <main className="page-container animate-fade-in">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
