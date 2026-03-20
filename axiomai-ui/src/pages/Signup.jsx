import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import '../components/components.css';

const Signup = () => {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }, // goes into raw_user_meta_data → trigger picks it up
            },
        });

        setLoading(false);

        if (error) {
            setError(error.message);
            return;
        }

        // If email confirmation is disabled, session is returned immediately
        if (data.session) {
            navigate('/dashboard/home', { replace: true });
        } else {
            // Email confirmation required — surface a message
            setSuccess(true);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/dashboard/home` },
        });
        if (error) setError(error.message);
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ textAlign: 'center', gap: '1.5rem' }}>
                    <div style={{ fontSize: '2rem' }}>✓</div>
                    <h2 style={{ color: 'var(--status-trusted)', fontSize: '1rem' }}>REGISTRATION COMPLETE</h2>
                    <p className="auth-sub">
                        Check your email inbox for a confirmation link before signing in.
                    </p>
                    <Link to="/login" className="auth-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
                        [→] GO TO LOGIN
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Brand */}
                <div className="auth-brand">
                    <img src="/logo.png" alt="AXIOMAI" style={{ height: 36, mixBlendMode: 'lighten' }} />
                    <span className="auth-brand-name">AXIOMAI</span>
                </div>

                <div className="auth-heading">
                    <h2 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>CREATE ACCOUNT</h2>
                    <p className="auth-sub">Register for the research intelligence platform</p>
                </div>

                <form onSubmit={handleSignup} className="auth-form">
                    <div className="auth-field">
                        <label className="auth-label mono">FULL NAME</label>
                        <input
                            type="text"
                            className="auth-input"
                            placeholder="Jane Smith"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            autoComplete="name"
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label mono">EMAIL</label>
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="user@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label mono">PASSWORD</label>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </div>

                    {error && (
                        <div className="auth-error mono">
                            <span style={{ color: 'var(--status-risk)' }}>⚠ {error}</span>
                        </div>
                    )}

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'CREATING ACCOUNT...' : '[+] CREATE ACCOUNT'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>OR CONTINUE WITH</span>
                </div>

                <button className="oauth-btn" onClick={handleGoogleSignup} type="button">
                    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                </button>

                <p className="auth-footer mono">
                    HAVE AN ACCOUNT? <Link to="/login" className="auth-link">SIGN IN →</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
