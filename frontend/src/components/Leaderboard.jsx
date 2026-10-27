import { formatGap, formatScore, getAlgorithmColor } from '../utils.js';

export default function Leaderboard({
    runs,
    metricName,
    hasLowerBound,
    baseline,
    timeLimitSeconds,
    selectedId,
    onSelectRun
}) {
    const gapHeader = hasLowerBound ? 'Gap to bound' : 'Gap to best';

    return (
        <div className="leaderboard card">
            <div className="leaderboard-header">
                <h3>Live Leaderboard</h3>
                <span className="leaderboard-sub-tag">Real-Time Standings</span>
            </div>
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Algorithm</th>
                            <th>Best {metricName}</th>
                            <th>{gapHeader}</th>
                            <th style={{ minWidth: 140 }}>Progress</th>
                            <th>Status</th>
                            <th>Compute time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {runs.map((run, index) => {
                            const isSelected = selectedId === run.algorithmCode || selectedId === run.runId;
                            const color = getAlgorithmColor(run.algorithmCode, index);
                            const rank = run.score != null ? index + 1 : '-';

                            return (
                                <tr
                                    key={run.runId || run.algorithmCode}
                                    className={`clickable-row ${isSelected ? 'selected-row' : ''}`}
                                    onClick={() => onSelectRun(run.algorithmCode || run.runId)}
                                >
                                    <td className="rank-cell">{rank}</td>
                                    <td>
                                        <div className="algo-cell">
                                            <span
                                                className="algo-dot"
                                                style={{ backgroundColor: color }}
                                            />
                                            <span className="algo-name">{run.name || run.algorithmCode}</span>
                                        </div>
                                    </td>
                                    <td>{run.score != null ? formatScore(run.score) : '-'}</td>
                                    <td>{formatGap(run.score, baseline)}</td>
                                    <td>
                                        <div className="progress-container">
                                            {run.status === 'completed' ? (
                                                <div className="progress-bar progress-full-green">
                                                    <span className="progress-text">100%</span>
                                                </div>
                                            ) : ['timed_out', 'cancelled'].includes(run.status) ? (
                                                <div className="progress-bar progress-full-muted">
                                                    <span className="progress-text">stopped</span>
                                                </div>
                                            ) : run.status === 'failed' ? (
                                                <div className="progress-bar progress-full-muted">
                                                    <span className="progress-text">failed</span>
                                                </div>
                                            ) : run.progress != null ? (
                                                <div
                                                    className="progress-bar progress-filled"
                                                    style={{ width: `${Math.min(100, Math.max(0, run.progress * 100))}%` }}
                                                >
                                                    <span className="progress-text">
                                                        {Math.round(run.progress * 100)}%
                                                    </span>
                                                </div>
                                            ) : run.status === 'running' ? (
                                                <div
                                                    className="progress-bar progress-striped"
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            timeLimitSeconds > 0
                                                                ? ((run.elapsedMs || 0) / (timeLimitSeconds * 1000)) * 100
                                                                : 0
                                                        )}%`
                                                    }}
                                                >
                                                    <span className="progress-text">budget</span>
                                                </div>
                                            ) : (
                                                <div className="progress-bar progress-empty" />
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`pill pill-${run.status || 'queued'}`}>
                                            {run.status || 'queued'}
                                        </span>
                                    </td>
                                    <td>
                                        {run.status === 'completed' && run.computeMs != null
                                            ? `${run.computeMs.toFixed(1)} ms`
                                            : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
