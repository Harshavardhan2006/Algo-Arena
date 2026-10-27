import { useState } from 'react';
import { useRace } from '../hooks/useRace.js';
import AlgorithmDetails from './AlgorithmDetails.jsx';
import ConvergenceChart from './ConvergenceChart.jsx';
import EventStream from './EventStream.jsx';
import Leaderboard from './Leaderboard.jsx';
import RaceCompletedView from './RaceCompletedView.jsx';
import RaceHeader from './RaceHeader.jsx';
import StatsRow from './StatsRow.jsx';

const METRIC_NAMES = {
    scheduling: 'makespan',
    routing: 'distance',
    resource: 'profit',
    coloring: 'colors'
};

export default function LiveRace({ raceId }) {
    const { race, events, error, refresh } = useRace(raceId);
    const [selectedId, setSelectedId] = useState(null);
    const [activeSubTab, setActiveSubTab] = useState('live');

    const metricName = (race?.problemType && METRIC_NAMES[race.problemType.toLowerCase()]) || 'score';

    const runs = (race?.runs || []).map((run) => {
        const code = run.algorithm || run.algorithmCode;
        const runEvents = events.filter((e) => e.runId === run.runId || e.algorithmCode === code);
        const lastEvent = runEvents.length > 0 ? runEvents[runEvents.length - 1] : null;

        let status = 'queued';
        if (lastEvent) {
            if (lastEvent.type === 'started' || lastEvent.type === 'progress') {
                status = 'running';
            } else if (lastEvent.type === 'final') {
                status = 'completed';
            } else if (['timed_out', 'cancelled', 'failed'].includes(lastEvent.type)) {
                status = lastEvent.type;
            } else {
                status = lastEvent.type;
            }
        } else if (run.status) {
            status = run.status;
        }

        let score = run.score ?? null;
        for (const e of runEvents) {
            if (e.score != null) {
                if (score == null || e.score < score) {
                    score = e.score;
                }
            }
        }

        const iterations = lastEvent?.iteration ?? run.iterations ?? null;
        const elapsedMs = lastEvent?.elapsedMs ?? run.elapsedMs ?? null;
        const computeMs = lastEvent?.computeMs ?? run.computeMs ?? null;
        const progress = lastEvent?.progress ?? run.progress ?? null;
        const stats = lastEvent?.stats ?? run.stats ?? null;

        return {
            ...run,
            algorithmCode: code,
            status,
            score,
            iterations,
            elapsedMs,
            computeMs,
            progress,
            stats
        };
    });

    const sortedRuns = [...runs].sort((a, b) => {
        if (a.score == null && b.score == null) return 0;
        if (a.score == null) return 1;
        if (b.score == null) return -1;
        return a.score - b.score;
    });

    let lowestLowerBound = null;
    for (const e of events) {
        if (e.stats && typeof e.stats.lowerBound === 'number') {
            if (lowestLowerBound == null || e.stats.lowerBound < lowestLowerBound) {
                lowestLowerBound = e.stats.lowerBound;
            }
        }
    }
    for (const r of runs) {
        if (r.stats && typeof r.stats.lowerBound === 'number') {
            if (lowestLowerBound == null || r.stats.lowerBound < lowestLowerBound) {
                lowestLowerBound = r.stats.lowerBound;
            }
        }
    }

    const hasLowerBound = lowestLowerBound != null;
    let bestScoreInRace = null;
    for (const r of sortedRuns) {
        if (r.score != null) {
            if (bestScoreInRace == null || r.score < bestScoreInRace) {
                bestScoreInRace = r.score;
            }
        }
    }
    const baseline = hasLowerBound ? lowestLowerBound : bestScoreInRace;

    const selectedRun =
        sortedRuns.find((r) => r.algorithmCode === selectedId || r.runId === selectedId) ||
        sortedRuns[0] ||
        null;

    const isCompleted = race?.status === 'completed';

    return (
        <div className="live-race-container">
            {error && <div className="error-banner card">{error}</div>}

            <RaceHeader race={race} raceId={raceId} onActionTriggered={refresh} />

            <div className="race-subnav-bar">
                <button
                    type="button"
                    className={`race-subnav-btn ${activeSubTab === 'live' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('live')}
                >
                    <span className="subnav-indicator-dot" />
                    <span>Live Dashboard</span>
                </button>

                <button
                    type="button"
                    className={`race-subnav-btn ${activeSubTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('completed')}
                >
                    <span>Post-Race Analysis</span>
                    {isCompleted && <span className="subnav-pill-done">Ready</span>}
                </button>

                <button
                    type="button"
                    className={`race-subnav-btn ${activeSubTab === 'input' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('input')}
                >
                    <span>Input Details</span>
                </button>

                <button
                    type="button"
                    className={`race-subnav-btn ${activeSubTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('logs')}
                >
                    <span>Live Logs ({events.length})</span>
                </button>
            </div>

            {activeSubTab === 'completed' || (isCompleted && activeSubTab === 'live' && false) ? (
                <RaceCompletedView
                    race={race}
                    runs={sortedRuns}
                    events={events}
                    lowestLowerBound={lowestLowerBound}
                    metricName={metricName}
                />
            ) : activeSubTab === 'input' ? (
                <div className="input-details-view card">
                    <h3 className="section-heading-sm">Input Dataset Details</h3>
                    <div className="inspect-meta">
                        <span>Dataset Name: <strong>{race?.datasetName}</strong></span>
                        <span className="meta-bullet">&bull;</span>
                        <span>Problem Type: <strong>{race?.problemType}</strong></span>
                        <span className="meta-bullet">&bull;</span>
                        <span>Size Metric: <strong>{race?.datasetSize || 'N/A'}</strong></span>
                        <span className="meta-bullet">&bull;</span>
                        <span>Time Budget: <strong>{race?.timeLimitSeconds}s</strong></span>
                    </div>
                    <pre className="input-raw-json">
                        {JSON.stringify(race, null, 2)}
                    </pre>
                </div>
            ) : activeSubTab === 'logs' ? (
                <div className="logs-full-view card">
                    <div className="chart-header-row">
                        <h3 className="section-heading-sm">Complete Event Stream Log</h3>
                        <span className="muted text-xs">{events.length} Total Events Recorded</span>
                    </div>
                    <div className="stream-list-full monospace">
                        {events.length === 0 ? (
                            <div className="muted stream-empty">No events recorded yet.</div>
                        ) : (
                            events.map((e) => (
                                <div key={e.eventId} className="stream-line">
                                    <span className="stream-time">[{e.elapsedMs || 0}ms]</span>
                                    <span className="stream-algo font-bold">{e.algorithmCode}</span>
                                    <span className="stream-type-pill">{e.type}</span>
                                    {e.score != null && <span className="stream-score">score: {e.score}</span>}
                                    {e.iteration != null && <span className="stream-iter">iter: {e.iteration}</span>}
                                    {e.computeMs != null && <span className="stream-compute">compute: {e.computeMs.toFixed(1)}ms</span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <StatsRow race={race} runs={sortedRuns} events={events} />

                    <div className="dashboard-grid">
                        <div className="grid-left">
                            <Leaderboard
                                runs={sortedRuns}
                                metricName={metricName}
                                hasLowerBound={hasLowerBound}
                                baseline={baseline}
                                timeLimitSeconds={race?.timeLimitSeconds || 30}
                                selectedId={selectedRun?.algorithmCode || selectedRun?.runId}
                                onSelectRun={setSelectedId}
                            />
                            <ConvergenceChart
                                events={events}
                                lowestLowerBound={lowestLowerBound}
                                metricName={metricName.toUpperCase()}
                            />
                        </div>
                        <div className="grid-right">
                            <EventStream events={events} />
                            <AlgorithmDetails run={selectedRun} metricName={metricName} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}