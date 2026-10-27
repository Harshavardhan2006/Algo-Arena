import { useState } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
    ZAxis
} from 'recharts';
import { formatGap, formatInt, formatScore, getAlgorithmColor } from '../utils.js';

export default function RaceCompletedView({ race, runs, events, lowestLowerBound, metricName }) {
    const [activeTab, setActiveTab] = useState('overview');

    const completedAtFormatted = race?.completedAt
        ? new Date(race.completedAt).toLocaleTimeString()
        : '-';

    let durationMs = 0;
    if (race?.startedAt && race?.completedAt) {
        durationMs = Math.max(0, new Date(race.completedAt).getTime() - new Date(race.startedAt).getTime());
    }
    const durationMins = Math.floor(durationMs / 60000);
    const durationSecs = Math.floor((durationMs % 60000) / 1000);
    const durationFormatted = `00:${String(durationMins).padStart(2, '0')}:${String(durationSecs).padStart(2, '0')}`;

    function exportReport() {
        const report = {
            raceId: race?.raceId,
            problemType: race?.problemType,
            datasetName: race?.datasetName,
            datasetSize: race?.datasetSize,
            startedAt: race?.startedAt,
            completedAt: race?.completedAt,
            durationMs,
            runs: runs.map((r) => ({
                algorithm: r.algorithmCode || r.name,
                status: r.status,
                score: r.score,
                computeMs: r.computeMs,
                iterations: r.iterations,
                stats: r.stats,
                payload: r.resultOutput
            })),
            eventCount: events.length
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `algoarena-race-${race?.raceId || 'report'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const paretoPoints = runs
        .filter((r) => r.computeMs != null && r.score != null)
        .map((r, idx) => ({
            algorithm: r.name || r.algorithmCode,
            code: r.algorithmCode,
            timeMs: Number(r.computeMs.toFixed(1)),
            score: r.score,
            color: getAlgorithmColor(r.algorithmCode, idx)
        }));

    const sortedByTime = [...paretoPoints].sort((a, b) => a.timeMs - b.timeMs);
    let bestScoreSoFar = Infinity;
    const frontierPoints = [];
    for (const pt of sortedByTime) {
        if (pt.score <= bestScoreSoFar) {
            frontierPoints.push({ timeMs: pt.timeMs, score: pt.score });
            bestScoreSoFar = pt.score;
        }
    }

    const scoredEvents = events.filter((e) => e.score != null);
    const algorithms = Array.from(new Set(scoredEvents.map((e) => e.algorithmCode)));
    const timeMap = new Map();
    const currentScores = {};

    for (const e of scoredEvents) {
        const time = Number(((e.elapsedMs || 0) / 1000).toFixed(2));
        currentScores[e.algorithmCode] = e.score;
        timeMap.set(time, { time, ...currentScores });
    }

    const convergenceChartData = Array.from(timeMap.values()).sort((a, b) => a.time - b.time);

    let bestScoreInRace = null;
    for (const r of runs) {
        if (r.score != null) {
            if (bestScoreInRace == null || r.score < bestScoreInRace) {
                bestScoreInRace = r.score;
            }
        }
    }
    const baseline = lowestLowerBound != null ? lowestLowerBound : bestScoreInRace;

    return (
        <div className="race-completed-container card">
            <div className="completed-header-box">
                <div className="completed-header-left">
                    <div className="checkmark-circle-glow">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div>
                        <div className="completed-title-row">
                            <h2 className="completed-title">Race Completed</h2>
                            <span className="badge badge-completed">Finished</span>
                        </div>
                        <div className="completed-meta-row">
                            <span className="meta-dataset-highlight">{race?.datasetName || 'Dataset'}</span>
                            <span className="meta-bullet">&bull;</span>
                            <span>Completed at: <strong>{completedAtFormatted}</strong></span>
                            <span className="meta-bullet">&bull;</span>
                            <span>Duration: <strong>{durationFormatted}</strong></span>
                        </div>
                    </div>
                </div>

                <div className="completed-header-right">
                    <button type="button" className="btn-export-report" onClick={exportReport}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" x2="12" y1="15" y2="3" />
                        </svg>
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            <div className="completed-tab-bar">
                <button
                    type="button"
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    type="button"
                    className={`tab-btn ${activeTab === 'convergence' ? 'active' : ''}`}
                    onClick={() => setActiveTab('convergence')}
                >
                    Convergence
                </button>
                <button
                    type="button"
                    className={`tab-btn ${activeTab === 'pareto' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pareto')}
                >
                    Pareto Analysis
                </button>
                <button
                    type="button"
                    className={`tab-btn ${activeTab === 'quality' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quality')}
                >
                    Solution Quality
                </button>
                <button
                    type="button"
                    className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                >
                    Run Details
                </button>
            </div>

            <div className="completed-tab-content">
                {(activeTab === 'overview' || activeTab === 'pareto') && (
                    <div className="completed-grid-two-column">
                        <div className="completed-column">
                            <h3 className="section-heading-sm">Final Leaderboard</h3>
                            <div className="table-responsive">
                                <table className="completed-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Algorithm</th>
                                            <th>Best {metricName}</th>
                                            <th>Gap</th>
                                            <th>Compute Time</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {runs.map((run, idx) => {
                                            const color = getAlgorithmColor(run.algorithmCode, idx);
                                            return (
                                                <tr key={run.runId || idx}>
                                                    <td className="rank-cell">
                                                        <span className={`rank-badge rank-${idx + 1}`}>{idx + 1}</span>
                                                    </td>
                                                    <td>
                                                        <div className="algo-cell">
                                                            <span className="algo-dot" style={{ backgroundColor: color }} />
                                                            <span className="algo-name">{run.name || run.algorithmCode}</span>
                                                        </div>
                                                    </td>
                                                    <td className="score-cell">
                                                        {run.score != null ? formatScore(run.score) : '-'}
                                                    </td>
                                                    <td>{formatGap(run.score, baseline)}</td>
                                                    <td>
                                                        {run.computeMs != null ? `${run.computeMs.toFixed(1)} ms` : '-'}
                                                    </td>
                                                    <td>
                                                        <span className={`pill pill-${run.status}`}>{run.status}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="completed-summary-stats">
                                <div className="summary-stat-box">
                                    <span className="summary-label">Winning Algorithm</span>
                                    <span className="summary-value highlight-green">
                                        {runs[0]?.name || runs[0]?.algorithmCode || '-'}
                                    </span>
                                </div>
                                <div className="summary-stat-box">
                                    <span className="summary-label">Optimal Score</span>
                                    <span className="summary-value">
                                        {runs[0]?.score != null ? formatScore(runs[0].score) : '-'}
                                    </span>
                                </div>
                                <div className="summary-stat-box">
                                    <span className="summary-label">Fastest Algorithm</span>
                                    <span className="summary-value highlight-cyan">
                                        {[...runs].sort((a, b) => (a.computeMs || 0) - (b.computeMs || 0))[0]?.name || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="completed-column">
                            <div className="chart-header-row">
                                <h3 className="section-heading-sm">Pareto Frontier (Speed vs Optimality)</h3>
                                <span className="chart-tag">Trade-Off Curve</span>
                            </div>
                            <div style={{ width: '100%', height: 290 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#24304f" vertical={false} />
                                        <XAxis
                                            type="number"
                                            dataKey="timeMs"
                                            name="Compute Time"
                                            unit="ms"
                                            stroke="#8392b5"
                                            fontSize={12}
                                        />
                                        <YAxis
                                            type="number"
                                            dataKey="score"
                                            name="Score"
                                            stroke="#8392b5"
                                            domain={['dataMin - 1', 'dataMax + 1']}
                                            tickFormatter={(val) =>
                                                Intl.NumberFormat('en-US', { notation: 'compact' }).format(val)
                                            }
                                            fontSize={12}
                                        />
                                        <ZAxis range={[120, 120]} />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="chart-custom-tooltip">
                                                            <div className="tooltip-title" style={{ color: data.color }}>
                                                                {data.algorithm}
                                                            </div>
                                                            <div className="tooltip-row">
                                                                <span>Score:</span> <strong>{formatScore(data.score)}</strong>
                                                            </div>
                                                            <div className="tooltip-row">
                                                                <span>Time:</span> <strong>{data.timeMs} ms</strong>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        {paretoPoints.map((entry, index) => (
                                            <Scatter
                                                key={`scatter-${index}`}
                                                name={entry.algorithm}
                                                data={[entry]}
                                                fill={entry.color}
                                            />
                                        ))}
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="pareto-legend-row">
                                {paretoPoints.map((pt) => (
                                    <div key={pt.code} className="pareto-legend-item">
                                        <span className="legend-dot" style={{ backgroundColor: pt.color }} />
                                        <span className="legend-text">{pt.algorithm}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'convergence' && (
                    <div className="completed-single-view">
                        <h3 className="section-heading-sm">Convergence Profile (Score vs Time)</h3>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={convergenceChartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#24304f" vertical={false} />
                                    <XAxis
                                        dataKey="time"
                                        stroke="#8392b5"
                                        tickFormatter={(t) => `${t}s`}
                                        fontSize={12}
                                    />
                                    <YAxis
                                        stroke="#8392b5"
                                        domain={['dataMin - 1', 'dataMax + 1']}
                                        tickFormatter={(val) =>
                                            Intl.NumberFormat('en-US', { notation: 'compact' }).format(val)
                                        }
                                        fontSize={12}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#111726',
                                            borderColor: '#24304f',
                                            borderRadius: 8,
                                            color: '#e6ebf5'
                                        }}
                                        formatter={(val) => [formatScore(val), '']}
                                        labelFormatter={(lbl) => `Time: ${lbl}s`}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                                    {lowestLowerBound != null && (
                                        <ReferenceLine
                                            y={lowestLowerBound}
                                            stroke="#8392b5"
                                            strokeDasharray="4 4"
                                            label={{ value: 'Lower Bound', fill: '#8392b5', fontSize: 12 }}
                                        />
                                    )}
                                    {algorithms.map((algo, idx) => (
                                        <Line
                                            key={algo}
                                            type="stepAfter"
                                            dataKey={algo}
                                            stroke={getAlgorithmColor(algo, idx)}
                                            strokeWidth={2.5}
                                            dot={false}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {activeTab === 'quality' && (
                    <div className="completed-single-view">
                        <h3 className="section-heading-sm">Solution Quality & Optimality Verification</h3>
                        <div className="quality-grid">
                            {runs.map((r) => (
                                <div key={r.runId || r.algorithmCode} className="quality-card card">
                                    <div className="quality-card-header">
                                        <h4>{r.name || r.algorithmCode}</h4>
                                        <span className={`pill pill-${r.status}`}>{r.status}</span>
                                    </div>
                                    <div className="quality-stats">
                                        <div className="q-stat">
                                            <span>Final Score:</span>
                                            <strong>{r.score != null ? formatScore(r.score) : '-'}</strong>
                                        </div>
                                        <div className="q-stat">
                                            <span>Iterations Explored:</span>
                                            <strong>{formatInt(r.iterations)}</strong>
                                        </div>
                                        <div className="q-stat">
                                            <span>Active Compute:</span>
                                            <strong>{r.computeMs != null ? `${r.computeMs.toFixed(1)} ms` : '-'}</strong>
                                        </div>
                                    </div>
                                    {r.resultOutput && (
                                        <div className="payload-box">
                                            <span className="payload-label">Output Payload:</span>
                                            <pre className="payload-json">
                                                {JSON.stringify(r.resultOutput, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'details' && (
                    <div className="completed-single-view">
                        <h3 className="section-heading-sm">Raw Benchmark Run Details</h3>
                        <div className="details-raw-box card">
                            <pre className="raw-json-view">
                                {JSON.stringify({ race, runs, eventCount: events.length }, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
