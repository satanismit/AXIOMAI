import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps protected routes. If there is no active session, redirects to /login.
 * While the session is still loading, renders nothing to prevent flash.
 */
const ProtectedRoute = ({ children }) => {
    const { session, loading } = useAuth();

    if (loading) {
        // Session check in progress — render a blank dark screen to avoid flash
        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    INITIALIZING SESSION...
                </span>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
