import { useEffect, useState } from 'react';
import { formatScore } from '../utils.js';

const METRIC_NAMES = {
    scheduling: 'makespan',
    routing: 'distance',
    resource: 'profit',
    coloring: 'colors'
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
            const pausedOffset = Number(race.pausedTotalMs) || 0;
            elapsedMs = Math.max(0, now - start - pausedOffset);
        }
    }

    const metricKey = (race?.problemType && METRIC_NAMES[race.problemType.toLowerCase()]) || 'Score';

    let bestScore = null;
    for (const r of runs) {
        if (r.score != null) {
            if (bestScore == null || r.score < bestScore) {
                bestScore = r.score;
            }
        }
    }

    const runningCount = runs.filter((r) => r.status === 'running').length;

    let eventsPerSec = 0;
    if (race?.status === 'running' && events.length > 0) {
        const recent = events.slice(-30);
        if (recent.length > 1) {
            const first = recent[0].elapsedMs || 0;
            const last = recent[recent.length - 1].elapsedMs || 0;
            const dtSec = (last - first) / 1000;
            if (dtSec > 0.1) {
                eventsPerSec = Math.round(recent.length / dtSec);
            }
        }
        if (eventsPerSec === 0) eventsPerSec = Math.min(128, events.length * 4);
    } else if (events.length > 0) {
        eventsPerSec = events.length;
    }

    return (
        <div className="stats-row">
            <div className="stat-card card">
                <span className="stat-label">TIME ELAPSED</span>
                <span className="stat-value">{formatElapsed(elapsedMs)}</span>
            </div>

            <div className="stat-card card">
                <span className="stat-label">BEST ({metricKey.toUpperCase()})</span>
                <span className="stat-value">
                    {bestScore != null ? formatScore(bestScore) : '-'}
                </span>
            </div>

            <div className="stat-card card">
                <span className="stat-label">ALGORITHMS RUNNING</span>
                <span className="stat-value">{runningCount} / {runs.length}</span>
            </div>

            <div className="stat-card card">
                <div className="stat-label-row">
                    <span className="stat-label">CURRENT UPDATES</span>
                    <svg className="sparkline-pulse-icon" width="28" height="14" viewBox="0 0 40 16" fill="none">
                        <path
                            d="M2 8H10L14 2L18 14L22 4L26 12L30 8H38"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <span className="stat-value">
                    {race?.status === 'running' ? `${eventsPerSec} events/s` : `${events.length} events`}
                </span>
            </div>
        </div>
    );
}
