export default function Navbar({ username, onLogout, onNavigate, currentRoute }) {
    return (
        <header className="top-navbar">
            <div className="navbar-container">
                <div className="navbar-left" onClick={() => onNavigate('home')}>
                    <div className="brand-logo">
                        <svg className="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" stroke="#6366f1" fill="rgba(99, 102, 241, 0.2)" />
                            <polyline points="2 17 12 22 22 17" stroke="#3b82f6" />
                            <polyline points="2 12 12 17 22 12" stroke="#8b5cf6" />
                        </svg>
                        <span className="brand-text">AlgoArena</span>
                    </div>
                </div>

                <nav className="navbar-links">
                    <button
                        type="button"
                        className={`nav-link ${currentRoute === 'home' ? 'active' : ''}`}
                        onClick={() => onNavigate('home')}
                    >
                        Home
                    </button>
                    <button
                        type="button"
                        className={`nav-link ${currentRoute === 'problems' || currentRoute === 'new' ? 'active' : ''}`}
                        onClick={() => onNavigate('problems')}
                    >
                        Problems
                    </button>
                    <button
                        type="button"
                        className={`nav-link ${currentRoute === 'leaderboards' ? 'active' : ''}`}
                        onClick={() => onNavigate('leaderboards')}
                    >
                        Leaderboards
                    </button>
                    <button
                        type="button"
                        className={`nav-link ${currentRoute === 'datasets' ? 'active' : ''}`}
                        onClick={() => onNavigate('datasets')}
                    >
                        Datasets
                    </button>
                    <button
                        type="button"
                        className={`nav-link ${currentRoute === 'analytics' ? 'active' : ''}`}
                        onClick={() => onNavigate('analytics')}
                    >
                        Analytics
                    </button>
                    <a
                        href="https://github.com/Harshavardhan2006/Algo-Arena"
                        target="_blank"
                        rel="noreferrer"
                        className="nav-link"
                    >
                        Docs
                    </a>
                </nav>

                <div className="navbar-right">
                    {username ? (
                        <div className="user-nav-profile">
                            <div className="user-avatar-small">
                                {username.charAt(0).toUpperCase()}
                            </div>
                            <span className="user-nav-name">{username}</span>
                            <button
                                type="button"
                                className="btn-primary-sm"
                                onClick={() => onNavigate('problems')}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                                </svg>
                                Start a Race
                            </button>
                            <button type="button" className="btn-logout-nav" onClick={onLogout}>
                                Log out
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="btn-primary-nav"
                            onClick={() => onNavigate('login')}
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
