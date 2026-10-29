import { useState } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const WIN_RATE_HISTORY = [
    { month: 'Jan', genetic: 45, branch_bound: 35, sa: 10, lpt: 6, greedy: 4 },
    { month: 'Feb', genetic: 48, branch_bound: 34, sa: 10, lpt: 5, greedy: 3 },
    { month: 'Mar', genetic: 50, branch_bound: 33, sa: 9, lpt: 5, greedy: 3 },
    { month: 'Apr', genetic: 53, branch_bound: 31, sa: 8, lpt: 5, greedy: 3 },
    { month: 'May', genetic: 51, branch_bound: 33, sa: 9, lpt: 4, greedy: 3 },
    { month: 'Jun', genetic: 52.4, branch_bound: 32.2, sa: 8.5, lpt: 4.1, greedy: 2.8 }
];

const LEADERBOARD_ROWS = [
    {
        rank: 1,
        code: 'genetic',
        name: 'Genetic Algorithm',
        color: '#10b981',
        wins: 182,
        winRate: '52.4%',
        avgGap: '4.21%',
        totalRuns: 347
    },
    {
        rank: 2,
        code: 'branch_bound',
        name: 'Branch & Bound (Optimal)',
        color: '#06b6d4',
        wins: 112,
        winRate: '32.2%',
        avgGap: '1.85%',
        totalRuns: 347
    },
    {
        rank: 3,
        code: 'sa',
        name: 'Simulated Annealing',
        color: '#ec4899',
        wins: 30,
        winRate: '8.5%',
        avgGap: '5.12%',
        totalRuns: 347
    },
    {
        rank: 4,
        code: 'lpt',
        name: 'Longest Processing Time (LPT)',
        color: '#3b82f6',
        wins: 14,
        winRate: '4.1%',
        avgGap: '8.40%',
        totalRuns: 347
    },
    {
        rank: 5,
        code: 'greedy',
        name: 'Greedy Heuristic (SJF)',
        color: '#f59e0b',
        wins: 9,
        winRate: '2.8%',
        avgGap: '14.92%',
        totalRuns: 347
    }
];

export default function GlobalLeaderboards({ onLaunchRace }) {
    const [problemType, setProblemType] = useState('all');
    const [datasetFilter, setDatasetFilter] = useState('all');
    const [metricFilter, setMetricFilter] = useState('best');
    const [timeRange, setTimeRange] = useState('all_time');
    const [activeTab, setActiveTab] = useState('global');

    return (
        <div className="global-leaderboards-container">
            <div className="leaderboards-header-box">
                <div>
                    <h1 className="leaderboards-title">Global Leaderboards</h1>
                    <p className="leaderboards-subtitle">
                        Top performing algorithms across all datasets (All Time)
                    </p>
                </div>
                {onLaunchRace && (
                    <button type="button" className="btn-hero-primary" onClick={onLaunchRace}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                        </svg>
                        <span>Start New Race</span>
                    </button>
                )}
            </div>

            <div className="filters-bar card">
                <div className="filter-group">
                    <label className="filter-label">Problem Type</label>
                    <select
                        className="filter-select"
                        value={problemType}
                        onChange={(e) => setProblemType(e.target.value)}
                    >
                        <option value="all">All Problem Types</option>
                        <option value="scheduling">Job Scheduling</option>
                        <option value="routing">Routing / Graph (TSP)</option>
                        <option value="resource">Resource Allocation</option>
                        <option value="coloring">Graph Coloring / CSP</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Dataset</label>
                    <select
                        className="filter-select"
                        value={datasetFilter}
                        onChange={(e) => setDatasetFilter(e.target.value)}
                    >
                        <option value="all">All Datasets</option>
                        <option value="search-24">search-24-jobs-101</option>
                        <option value="berlin52">berlin52.json (TSP)</option>
                        <option value="kroA100">kroA100.csv (VRP)</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Metric</label>
                    <select
                        className="filter-select"
                        value={metricFilter}
                        onChange={(e) => setMetricFilter(e.target.value)}
                    >
                        <option value="best">Best Makespan / Distance</option>
                        <option value="time">Compute Time</option>
                        <option value="iterations">Node Iterations</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Time Range</label>
                    <select
                        className="filter-select"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <option value="all_time">All Time</option>
                        <option value="30d">Past 30 Days</option>
                        <option value="7d">Past 7 Days</option>
                        <option value="24h">Past 24 Hours</option>
                    </select>
                </div>
            </div>

            <div className="leaderboard-tabs-bar">
                <button
                    type="button"
                    className={`leaderboard-tab-btn ${activeTab === 'global' ? 'active' : ''}`}
                    onClick={() => setActiveTab('global')}
                >
                    Global
                </button>
                <button
                    type="button"
                    className={`leaderboard-tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    Friends
                </button>
                <button
                    type="button"
                    className={`leaderboard-tab-btn ${activeTab === 'my_runs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my_runs')}
                >
                    My Runs
                </button>
            </div>

            <div className="leaderboards-table-card card">
                <div className="table-responsive">
                    <table className="global-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Algorithm</th>
                                <th>Wins</th>
                                <th>Win Rate</th>
                                <th>Avg. Gap (%)</th>
                                <th>Total Runs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {LEADERBOARD_ROWS.map((row) => (
                                <tr key={row.code}>
                                    <td className="rank-cell">
                                        <span className={`rank-pill rank-${row.rank}`}>
                                            {row.rank}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="algo-cell">
                                            <span className="algo-dot" style={{ backgroundColor: row.color }} />
                                            <span className="algo-name" style={{ color: row.color }}>
                                                {row.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td><strong>{row.wins}</strong></td>
                                    <td>
                                        <div className="win-rate-cell">
                                            <div className="win-rate-bar-bg">
                                                <div
                                                    className="win-rate-bar-fill"
                                                    style={{ width: row.winRate, backgroundColor: row.color }}
                                                />
                                            </div>
                                            <span>{row.winRate}</span>
                                        </div>
                                    </td>
                                    <td>{row.avgGap}</td>
                                    <td>{row.totalRuns}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="win-rate-chart-card card">
                <div className="chart-header-row">
                    <div>
                        <h3 className="section-heading-sm">Win Rate Over Time</h3>
                        <p className="chart-desc-text">Historical algorithm win rate convergence trajectories across benchmark datasets</p>
                    </div>
                </div>

                <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={WIN_RATE_HISTORY} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#24304f" vertical={false} />
                            <XAxis dataKey="month" stroke="#8392b5" fontSize={12} />
                            <YAxis
                                stroke="#8392b5"
                                domain={[0, 100]}
                                tickFormatter={(val) => `${val}%`}
                                fontSize={12}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#111726',
                                    borderColor: '#24304f',
                                    borderRadius: 8,
                                    color: '#e6ebf5'
                                }}
                                formatter={(val) => [`${val}%`, '']}
                            />
                            <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                            <Line
                                type="monotone"
                                dataKey="genetic"
                                name="Genetic Algorithm"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                dot={{ r: 4 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="branch_bound"
                                name="Branch & Bound"
                                stroke="#06b6d4"
                                strokeWidth={2.5}
                                dot={{ r: 4 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="sa"
                                name="Simulated Annealing"
                                stroke="#ec4899"
                                strokeWidth={2.5}
                                dot={{ r: 4 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="lpt"
                                name="Longest Processing Time"
                                stroke="#3b82f6"
                                strokeWidth={2.5}
                                dot={{ r: 4 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="greedy"
                                name="Greedy Heuristic"
                                stroke="#f59e0b"
                                strokeWidth={2.5}
                                dot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
