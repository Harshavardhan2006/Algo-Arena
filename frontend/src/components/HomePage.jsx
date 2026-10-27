import { useEffect, useState } from 'react';

export default function HomePage({ onStartRace, onExploreProblems, onSelectProblem }) {
    const [elapsed, setElapsed] = useState(12.45);
    const [cars, setCars] = useState([
        { id: 1, name: 'Genetic Algorithm', color: '#10b981', progress: 92.4, score: 754.21 },
        { id: 2, name: 'Branch & Bound', color: '#06b6d4', progress: 91.1, score: 754.21 },
        { id: 3, name: 'Dynamic Programming', color: '#8b5cf6', progress: 78.6, score: 812.47 },
        { id: 4, name: 'Greedy Heuristic', color: '#f59e0b', progress: 62.3, score: 934.12 }
    ]);

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsed((prev) => {
                const next = prev + 0.1;
                return Number(next.toFixed(2));
            });
            setCars((prev) =>
                prev.map((c) => {
                    const inc = Math.random() * 0.4;
                    const nextP = Math.min(100, Number((c.progress + inc).toFixed(1)));
                    return { ...c, progress: nextP >= 100 ? 92.4 : nextP };
                })
            );
        }, 150);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="home-container">
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="hero-badge-dot" />
                        <span>Real-Time Algorithmic Benchmarking Platform</span>
                    </div>
                    <h1 className="hero-title">
                        Watch Algorithms <br />
                        Race on <span className="hero-gradient-text">Your Own Data</span>
                    </h1>
                    <p className="hero-description">
                        Upload a problem instance. Run multiple algorithms simultaneously.
                        Visualize the race in real time. Make data-driven algorithmic decisions.
                    </p>
                    <div className="hero-actions">
                        <button type="button" className="btn-hero-primary" onClick={onStartRace}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                            </svg>
                            Start a Race
                        </button>
                        <button type="button" className="btn-hero-secondary" onClick={onExploreProblems}>
                            Explore Problems
                        </button>
                    </div>
                </div>

                <div className="hero-preview-wrapper">
                    <div className="hero-preview-card">
                        <div className="preview-header">
                            <div className="preview-title-box">
                                <span className="preview-label">LIVE RACE PREVIEW</span>
                                <span className="preview-problem-tag">TSP - Berlin52</span>
                            </div>
                            <div className="preview-live-badge">
                                <span className="pulse-dot-green" />
                                <span>LIVE</span>
                            </div>
                        </div>

                        <div className="preview-visual-track">
                            <div className="track-grid-lines" />
                            <div className="track-lanes">
                                {cars.map((car, idx) => (
                                    <div key={car.id} className="track-lane">
                                        <div
                                            className="track-car-glow"
                                            style={{
                                                left: `calc(${car.progress}% - 24px)`,
                                                borderColor: car.color,
                                                boxShadow: `0 0 16px ${car.color}88`
                                            }}
                                        >
                                            <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
                                                <rect x="2" y="3" width="18" height="8" rx="2" fill={car.color} />
                                                <rect x="7" y="1" width="8" height="12" rx="1" fill="#ffffff" fillOpacity="0.4" />
                                                <circle cx="5" cy="12" r="2" fill="#1e293b" />
                                                <circle cx="17" cy="12" r="2" fill="#1e293b" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="preview-progress-list">
                            {cars.map((car, idx) => (
                                <div key={car.id} className="preview-progress-row">
                                    <div className="preview-row-left">
                                        <span className="preview-rank">{idx + 1}</span>
                                        <span className="preview-name" style={{ color: car.color }}>
                                            {car.name}
                                        </span>
                                    </div>
                                    <div className="preview-row-bar">
                                        <div
                                            className="preview-bar-fill"
                                            style={{ width: `${car.progress}%`, backgroundColor: car.color }}
                                        />
                                    </div>
                                    <div className="preview-row-right">
                                        <span className="preview-pct">{car.progress}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="preview-footer">
                            <span className="preview-elapsed-label">
                                Time Elapsed: <strong>{elapsed}s</strong>
                            </span>
                            <button type="button" className="preview-interactive-btn" onClick={onStartRace}>
                                Launch Custom Race &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="problem-categories-section">
                <div className="section-header-box">
                    <span className="section-eyebrow">SUPPORTED PARADIGMS</span>
                    <h2 className="section-title">Explore Algorithmic Challenges</h2>
                    <p className="section-subtitle">
                        Compare heuristic, approximation, dynamic programming, and exact branch-and-bound implementations.
                    </p>
                </div>

                <div className="categories-grid">
                    <div
                        className="category-card"
                        onClick={() => onSelectProblem && onSelectProblem('scheduling')}
                    >
                        <div className="category-icon-box cat-green">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect width="18" height="18" x="3" y="4" rx="2" />
                                <line x1="16" x2="16" y1="2" y2="6" />
                                <line x1="8" x2="8" y1="2" y2="6" />
                                <line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                        </div>
                        <h3 className="category-title">Scheduling</h3>
                        <p className="category-desc">Job scheduling, CPU scheduling, flow shop makespan optimization</p>
                        <div className="category-footer">
                            <span className="category-badge">4-5 Algorithms</span>
                            <span className="category-link">Select &rarr;</span>
                        </div>
                    </div>

                    <div
                        className="category-card"
                        onClick={() => onSelectProblem && onSelectProblem('routing')}
                    >
                        <div className="category-icon-box cat-blue">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="6" cy="6" r="3" />
                                <circle cx="18" cy="18" r="3" />
                                <circle cx="18" cy="6" r="3" />
                                <line x1="8.5" x2="15.5" y1="7.5" y2="16.5" />
                                <line x1="18" x2="18" y1="9" y2="15" />
                            </svg>
                        </div>
                        <h3 className="category-title">Routing / Graph</h3>
                        <p className="category-desc">TSP, shortest path, vehicle routing, minimum spanning trees</p>
                        <div className="category-footer">
                            <span className="category-badge">4-5 Algorithms</span>
                            <span className="category-link">Select &rarr;</span>
                        </div>
                    </div>

                    <div
                        className="category-card"
                        onClick={() => onSelectProblem && onSelectProblem('resource')}
                    >
                        <div className="category-icon-box cat-orange">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" />
                                <path d="m3 8 9 5 9-5" />
                                <path d="M12 13v8" />
                            </svg>
                        </div>
                        <h3 className="category-title">Resource Allocation</h3>
                        <p className="category-desc">Knapsack, bin packing, resource distribution, max profit packing</p>
                        <div className="category-footer">
                            <span className="category-badge">4-5 Algorithms</span>
                            <span className="category-link">Select &rarr;</span>
                        </div>
                    </div>

                    <div
                        className="category-card"
                        onClick={() => onSelectProblem && onSelectProblem('coloring')}
                    >
                        <div className="category-icon-box cat-purple">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="m4.93 4.93 4.24 4.24" />
                                <path d="m14.83 9.17 4.24-4.24" />
                                <path d="m14.83 14.83 4.24 4.24" />
                                <path d="m9.17 14.83-4.24 4.24" />
                            </svg>
                        </div>
                        <h3 className="category-title">Graph Coloring / CSP</h3>
                        <p className="category-desc">Graph coloring, exam timetabling, constraint satisfaction problems</p>
                        <div className="category-footer">
                            <span className="category-badge">4-5 Algorithms</span>
                            <span className="category-link">Select &rarr;</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
