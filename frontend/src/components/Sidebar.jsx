export default function Sidebar({
    currentRoute,
    lastRaceId,
    onNavigate,
    username,
    onLogout
}) {
    return (
        <aside className="app-sidebar">
            <div className="sidebar-top">
                <div className="sidebar-brand-wrapper" onClick={() => onNavigate('home')}>
                    <div className="brand-logo-sidebar">
                        <svg className="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" stroke="#6366f1" fill="rgba(99, 102, 241, 0.2)" />
                            <polyline points="2 17 12 22 22 17" stroke="#3b82f6" />
                            <polyline points="2 12 12 17 22 12" stroke="#8b5cf6" />
                        </svg>
                        <span className="brand-text">AlgoArena</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {lastRaceId ? (
                        <button
                            type="button"
                            className={`sidebar-nav-item ${currentRoute === 'race' ? 'active' : ''}`}
                            onClick={() => onNavigate('race', lastRaceId)}
                        >
                            <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                            </svg>
                            <span>Live Race</span>
                            <span className="live-dot-indicator" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="sidebar-nav-item disabled"
                            disabled
                        >
                            <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                            </svg>
                            <span>Live Race</span>
                        </button>
                    )}

                    <button
                        type="button"
                        className={`sidebar-nav-item ${currentRoute === 'problems' || currentRoute === 'new' ? 'active' : ''}`}
                        onClick={() => onNavigate('problems')}
                    >
                        <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect width="7" height="9" x="3" y="3" rx="1" />
                            <rect width="7" height="5" x="14" y="3" rx="1" />
                            <rect width="7" height="9" x="14" y="12" rx="1" />
                            <rect width="7" height="5" x="3" y="16" rx="1" />
                        </svg>
                        <span>Create Race</span>
                    </button>

                    <button
                        type="button"
                        className={`sidebar-nav-item ${currentRoute === 'leaderboards' ? 'active' : ''}`}
                        onClick={() => onNavigate('leaderboards')}
                    >
                        <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                            <path d="M4 22h16" />
                            <path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34" />
                            <path d="M18 14.66V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34" />
                            <path d="M12 2a8 8 0 0 0-8 8c0 3.5 2.5 6.5 6 7.5V20H10a2 2 0 0 0 0 4h4a2 2 0 0 0 0-4h-2v-2.5c3.5-1 6-4 6-7.5a8 8 0 0 0-8-8z" />
                        </svg>
                        <span>Leaderboards</span>
                    </button>

                    <button
                        type="button"
                        className={`sidebar-nav-item ${currentRoute === 'datasets' ? 'active' : ''}`}
                        onClick={() => onNavigate('datasets')}
                    >
                        <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <ellipse cx="12" cy="5" rx="9" ry="3" />
                            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                        </svg>
                        <span>Datasets</span>
                    </button>

                    <button
                        type="button"
                        className={`sidebar-nav-item ${currentRoute === 'analytics' ? 'active' : ''}`}
                        onClick={() => onNavigate('analytics')}
                    >
                        <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" x2="18" y1="20" y2="10" />
                            <line x1="12" x2="12" y1="20" y2="4" />
                            <line x1="6" x2="6" y1="20" y2="14" />
                        </svg>
                        <span>Analytics</span>
                    </button>
                </nav>
            </div>

            <div className="sidebar-bottom">
                <a
                    href="https://github.com/Harshavardhan2006/Algo-Arena"
                    target="_blank"
                    rel="noreferrer"
                    className="sidebar-help-link"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" x2="12.01" y1="17" y2="17" />
                    </svg>
                    <span>Help & Docs</span>
                </a>

                <div className="sidebar-user-card">
                    <div className="user-avatar-medium">
                        {username ? username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="user-info">
                        <span className="user-display-name">{username || 'User'}</span>
                        <span className="user-role-label">View Profile</span>
                    </div>
                    <button
                        type="button"
                        className="btn-icon-logout"
                        title="Log out"
                        onClick={onLogout}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" x2="9" y1="12" y2="12" />
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    );
}
