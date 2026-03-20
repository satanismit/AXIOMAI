import React from 'react';
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
                    <NavLink to="/dashboard/home" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}> HOME</NavLink>
                    <NavLink to="/dashboard/copilot" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}> COPILOT</NavLink>
                </nav>

                <div className="nav-user-badge">
                    <span style={{ width: 6, height: 6, background: 'var(--status-trusted)', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px var(--status-trusted)' }}></span>
                    <span className="nav-user-email" title={user?.email}>
                        {user?.email ?? 'SYS_ONLINE'}
                    </span>
                    <button className="nav-logout-btn" onClick={handleLogout} title="Sign out">
                        [LOGOUT]
                    </button>
                </div>
            </header>

            <main className="page-container animate-fade-in">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
