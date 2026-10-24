import { useEffect, useState } from 'react';

const METRIC_NAMES = {
    scheduling: 'makespan'
};

function formatElapsed(ms) {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function StatsRow({ race, runs, events }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (race?.status !== 'running' || !race?.startedAt) return;
        const interval = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(interval);
    }, [race?.status, race?.startedAt]);

    let elapsedMs = 0;
    if (race?.startedAt) {
        const start = new Date(race.startedAt).getTime();
        if (race.completedAt) {
            elapsedMs = Math.max(0, new Date(race.completedAt).getTime() - start);
        } else if (race.status === 'running') {
            elapsedMs = Math.max(0, now - start);
        }
    }

    const metricName = (race?.problemType && METRIC_NAMES[race.problemType.toLowerCase()]) || 'score';

    let bestScore = null;
    for (const r of runs) {
        if (r.score != null) {
            if (bestScore == null || r.score < bestScore) {
                bestScore = r.score;
            }
        }
    }

    const formatter = new Intl.NumberFormat('en-US');
    const runningCount = runs.filter((r) => r.status === 'running').length;

    return (
        <div className="stats-row">
            <div className="stat-card card">
                <span className="stat-label">Time elapsed</span>
                <span className="stat-value">{formatElapsed(elapsedMs)}</span>
            </div>
            <div className="stat-card card">
                <span className="stat-label">Best {metricName}</span>
                <span className="stat-value">
                    {bestScore != null ? formatter.format(bestScore) : '-'}
                </span>
            </div>
            <div className="stat-card card">
                <span className="stat-label">Algorithms running</span>
                <span className="stat-value">{runningCount} / {runs.length}</span>
            </div>
            <div className="stat-card card">
                <span className="stat-label">Events</span>
                <span className="stat-value">{formatter.format(events.length)}</span>
            </div>
        </div>
    );
}
