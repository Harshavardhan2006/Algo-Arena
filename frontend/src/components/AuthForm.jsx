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
        <form className="card" onSubmit={submit}>
            <h2>{mode === 'login' ? 'Log in' : 'Create account'}</h2>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
            {mode === 'register' && (
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
            )}
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password (8+ characters)"
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={busy}>{mode === 'login' ? 'Log in' : 'Register'}</button>
            <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
            </button>
        </form>
    );
}