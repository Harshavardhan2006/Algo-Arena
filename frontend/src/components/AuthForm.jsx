import { useState } from 'react';
import { login, register, setToken } from '../api.js';

export default function AuthForm({ onAuthenticated }) {
    const [mode, setMode] = useState('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setError(null);
        setBusy(true);
        try {
            const data = mode === 'login'
                ? await login(username, password)
                : await register(username, email, password);
            setToken(data.token);
            onAuthenticated(data.username);
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <form className="auth-form-card" onSubmit={submit}>
            <div className="auth-form-header">
                <h2 className="auth-form-title">
                    {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="auth-form-subtitle">
                    {mode === 'login'
                        ? 'Sign in to access your benchmarking dashboard'
                        : 'Join AlgoArena to start running algorithm races'}
                </p>
            </div>

            <div className="auth-fields">
                <div className="auth-field-group">
                    <label className="auth-field-label">Username</label>
                    <input
                        className="auth-field-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        autoComplete="username"
                        required
                    />
                </div>

                {mode === 'register' && (
                    <div className="auth-field-group">
                        <label className="auth-field-label">Email</label>
                        <input
                            className="auth-field-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            autoComplete="email"
                            required
                        />
                    </div>
                )}

                <div className="auth-field-group">
                    <label className="auth-field-label">Password</label>
                    <input
                        className="auth-field-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        required
                    />
                </div>
            </div>

            {error && (
                <div className="auth-error-banner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="8" y2="12" />
                        <line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={busy}>
                {busy ? (
                    <span className="auth-loading">
                        <span className="auth-spinner" />
                        {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </span>
                ) : (
                    mode === 'login' ? 'Sign In' : 'Create Account'
                )}
            </button>

            <div className="auth-divider">
                <span>or</span>
            </div>

            <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError(null);
                }}
            >
                {mode === 'login'
                    ? "Don't have an account? Register"
                    : 'Already have an account? Sign in'}
            </button>
        </form>
    );
}
