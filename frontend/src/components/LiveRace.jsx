import { useState } from 'react';
import { useRace } from '../hooks/useRace.js';
import AlgorithmDetails from './AlgorithmDetails.jsx';
import ConvergenceChart from './ConvergenceChart.jsx';
import EventStream from './EventStream.jsx';
import Leaderboard from './Leaderboard.jsx';
import RaceHeader from './RaceHeader.jsx';
import StatsRow from './StatsRow.jsx';

const METRIC_NAMES = {
    scheduling: 'makespan'
};

export default function LiveRace({ raceId }) {
    const { race, events, error } = useRace(raceId);
    const [selectedId, setSelectedId] = useState(null);

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

    return (
        <div className="live-race-container">
            {error && <div className="error-banner card">{error}</div>}
            <RaceHeader race={race} raceId={raceId} />
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
                    <ConvergenceChart events={events} lowestLowerBound={lowestLowerBound} />
                </div>
                <div className="grid-right">
                    <EventStream events={events} />
                    <AlgorithmDetails run={selectedRun} metricName={metricName} />
                </div>
            </div>
        </div>
    );
}