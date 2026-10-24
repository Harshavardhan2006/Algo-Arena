import { useEffect, useState } from 'react';
import AuthForm from './components/AuthForm.jsx';
import DatasetForm from './components/DatasetForm.jsx';
import LiveRace from './components/LiveRace.jsx';
import { clearToken, getToken, setUnauthorizedHandler } from './api.js';

export default function App() {
    const [username, setUsername] = useState(getToken() ? localStorage.getItem('algoarena_username') : null);
    const [route, setRoute] = useState({ path: 'new' });
    const [lastRaceId, setLastRaceId] = useState(localStorage.getItem('algoarena_last_race_id'));

    function logout() {
        clearToken();
        localStorage.removeItem('algoarena_username');
        localStorage.removeItem('algoarena_last_race_id');
        setUsername(null);
        setLastRaceId(null);
        window.location.hash = '#/new';
    }

    function authenticated(name) {
        localStorage.setItem('algoarena_username', name);
        setUsername(name);
    }

    useEffect(() => {
        setUnauthorizedHandler(logout);

        function handleHash() {
            const current = window.location.hash;
            if (current.startsWith('#/race/')) {
                const idStr = current.slice(7);
                const id = Number(idStr);
                if (id) {
                    setRoute({ path: 'race', id });
                    setLastRaceId(String(id));
                    localStorage.setItem('algoarena_last_race_id', String(id));
                    return;
                }
            }
            setRoute({ path: 'new' });
            if (!current || current === '#' || current === '#/') {
                window.location.hash = '#/new';
            }
        }

        handleHash();
        window.addEventListener('hashchange', handleHash);
        return () => window.removeEventListener('hashchange', handleHash);
    }, []);

    if (!username) {
        return (
            <div className="login-wrapper">
                <div className="login-card-container">
                    <h1 className="brand-title">AlgoArena</h1>
                    <AuthForm onAuthenticated={authenticated} />
                </div>
            </div>
        );
    }

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="sidebar-top">
                    <div className="sidebar-brand">AlgoArena</div>
                    <nav className="sidebar-nav">
                        <a
                            href="#/new"
                            className={`nav-item ${route.path === 'new' ? 'active' : ''}`}
                        >
                            New race
                        </a>
                        {lastRaceId ? (
                            <a
                                href={`#/race/${lastRaceId}`}
                                className={`nav-item ${route.path === 'race' ? 'active' : ''}`}
                            >
                                Live race
                            </a>
                        ) : (
                            <span className="nav-item disabled">
                                Live race
                            </span>
                        )}
                    </nav>
                </div>
                <div className="sidebar-bottom">
                    <span className="sidebar-username">{username}</span>
                    <button type="button" className="btn-logout" onClick={logout}>
                        Log out
                    </button>
                </div>
            </aside>
            <main className="main-content">
                {route.path === 'race' && route.id ? (
                    <LiveRace key={route.id} raceId={route.id} />
                ) : (
                    <div className="new-race-wrapper">
                        <DatasetForm
                            onRaceCreated={(id) => {
                                window.location.hash = `#/race/${id}`;
                            }}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}