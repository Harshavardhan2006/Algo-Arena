import { useEffect, useState } from 'react';
import { clearToken, getToken, setUnauthorizedHandler } from './api.js';
import AuthForm from './components/AuthForm.jsx';
import CreateRaceWizard from './components/CreateRaceWizard.jsx';
import DatasetsBrowser from './components/DatasetsBrowser.jsx';
import GlobalLeaderboards from './components/GlobalLeaderboards.jsx';
import HomePage from './components/HomePage.jsx';
import LiveRace from './components/LiveRace.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';

export default function App() {
    const [username, setUsername] = useState(
        getToken() ? localStorage.getItem('algoarena_username') || 'harsha' : null
    );
    const [route, setRoute] = useState({ path: 'home' });
    const [lastRaceId, setLastRaceId] = useState(localStorage.getItem('algoarena_last_race_id'));

    function logout() {
        clearToken();
        localStorage.removeItem('algoarena_username');
        localStorage.removeItem('algoarena_last_race_id');
        setUsername(null);
        setLastRaceId(null);
        window.location.hash = '#/home';
    }

    function authenticated(name) {
        localStorage.setItem('algoarena_username', name);
        setUsername(name);
        window.location.hash = lastRaceId ? `#/race/${lastRaceId}` : '#/problems';
    }

    function navigate(path, id) {
        if (path === 'race' && id) {
            window.location.hash = `#/race/${id}`;
        } else if (path === 'home') {
            window.location.hash = '#/home';
        } else if (path === 'problems' || path === 'new') {
            window.location.hash = '#/problems';
        } else if (path === 'leaderboards') {
            window.location.hash = '#/leaderboards';
        } else if (path === 'datasets') {
            window.location.hash = '#/datasets';
        } else if (path === 'analytics') {
            window.location.hash = '#/analytics';
        } else if (path === 'login') {
            window.location.hash = '#/login';
        }
    }

    useEffect(() => {
        setUnauthorizedHandler(logout);

        function handleHash() {
            const current = window.location.hash || '#/home';
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
            if (current === '#/problems' || current === '#/new') {
                setRoute({ path: 'problems' });
                return;
            }
            if (current === '#/leaderboards') {
                setRoute({ path: 'leaderboards' });
                return;
            }
            if (current === '#/datasets') {
                setRoute({ path: 'datasets' });
                return;
            }
            if (current === '#/analytics') {
                setRoute({ path: 'analytics' });
                return;
            }
            if (current === '#/login') {
                setRoute({ path: 'login' });
                return;
            }
            setRoute({ path: 'home' });
        }

        handleHash();
        window.addEventListener('hashchange', handleHash);
        return () => window.removeEventListener('hashchange', handleHash);
    }, []);

    if (route.path === 'login' || (!username && (route.path === 'problems' || route.path === 'race'))) {
        return (
            <div className="login-wrapper">
                <Navbar
                    username={username}
                    onLogout={logout}
                    onNavigate={navigate}
                    currentRoute="login"
                />
                <div className="login-card-container">
                    <div className="login-card-header">
                        <div className="brand-logo-large">
                            <svg className="brand-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polygon points="12 2 2 7 12 12 22 7 12 2" stroke="#6366f1" fill="rgba(99, 102, 241, 0.2)" />
                                <polyline points="2 17 12 22 22 17" stroke="#3b82f6" />
                                <polyline points="2 12 12 17 22 12" stroke="#8b5cf6" />
                            </svg>
                            <h1 className="brand-title">AlgoArena</h1>
                        </div>
                        <p className="login-card-sub">Access competitive algorithmic benchmarking dashboard</p>
                    </div>
                    <AuthForm onAuthenticated={authenticated} />
                </div>
            </div>
        );
    }

    if (route.path === 'home') {
        return (
            <div className="site-wrapper">
                <Navbar
                    username={username}
                    onLogout={logout}
                    onNavigate={navigate}
                    currentRoute="home"
                />
                <main className="home-main-content">
                    <HomePage
                        onStartRace={() => {
                            if (!username) {
                                navigate('login');
                            } else {
                                navigate('problems');
                            }
                        }}
                        onExploreProblems={() => navigate('problems')}
                        onSelectProblem={() => navigate('problems')}
                    />
                </main>
            </div>
        );
    }

    return (
        <div className="app-shell">
            <Sidebar
                currentRoute={route.path}
                lastRaceId={lastRaceId}
                onNavigate={navigate}
                username={username || 'harsha.v'}
                onLogout={logout}
            />
            <main className="main-content">
                {route.path === 'race' && route.id ? (
                    <LiveRace key={route.id} raceId={route.id} />
                ) : route.path === 'problems' || route.path === 'new' ? (
                    <CreateRaceWizard
                        onRaceCreated={(id) => {
                            navigate('race', id);
                        }}
                    />
                ) : route.path === 'leaderboards' || route.path === 'analytics' ? (
                    <GlobalLeaderboards onLaunchRace={() => navigate('problems')} />
                ) : route.path === 'datasets' ? (
                    <DatasetsBrowser onLaunchRace={(id) => navigate('race', id)} />
                ) : (
                    <CreateRaceWizard
                        onRaceCreated={(id) => {
                            navigate('race', id);
                        }}
                    />
                )}
            </main>
        </div>
    );
}