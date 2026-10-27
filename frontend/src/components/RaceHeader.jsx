import { useState } from 'react';
import { pauseRace, resumeRace, stopRace } from '../api.js';

export default function RaceHeader({ race, raceId, onActionTriggered }) {
    const [busyAction, setBusyAction] = useState(null);
    const [error, setError] = useState(null);

    const isRunning = race?.status === 'running';
    const isPaused = race?.status === 'paused';

    async function handlePause() {
        if (!isRunning || busyAction) return;
        setBusyAction('pause');
        setError(null);
        try {
            await pauseRace(raceId);
            if (onActionTriggered) onActionTriggered();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusyAction(null);
        }
    }

    async function handleResume() {
        if (!isPaused || busyAction) return;
        setBusyAction('resume');
        setError(null);
        try {
            await resumeRace(raceId);
            if (onActionTriggered) onActionTriggered();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusyAction(null);
        }
    }

    async function handleStop() {
        if ((!isRunning && !isPaused) || busyAction) return;
        setBusyAction('stop');
        setError(null);
        try {
            await stopRace(raceId);
            if (onActionTriggered) onActionTriggered();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusyAction(null);
        }
    }

    const startTimeFormatted = race?.startedAt
        ? new Date(race.startedAt).toLocaleTimeString()
        : '-';

    return (
        <div className="race-header card">
            <div className="race-header-main">
                <div className="race-header-titles">
                    <div className="race-header-badges">
                        <span className="race-title-text">
                            {race?.datasetName || `Race #${raceId}`}
                            {race?.problemType ? ` (${race.problemType})` : ''}
                        </span>

                        {isRunning ? (
                            <span className="badge badge-live">
                                <span className="pulse-dot-green" />
                                LIVE
                            </span>
                        ) : isPaused ? (
                            <span className="badge badge-paused">
                                <span className="pulse-dot-amber" />
                                PAUSED
                            </span>
                        ) : (
                            <span className={`badge badge-${race?.status || 'pending'}`}>
                                {race?.status || 'pending'}
                            </span>
                        )}

                        <span className="race-dataset-tag">{race?.datasetName || 'Dataset'}</span>
                        <span className="race-problem-tag">{race?.problemType || 'scheduling'}</span>
                    </div>

                    <div className="race-header-sub">
                        <span className="race-id-code">Race ID: <strong>#RACE-{raceId}</strong></span>
                        <span className="meta-bullet">&bull;</span>
                        <span>Started at: <strong>{startTimeFormatted}</strong></span>
                        {race?.timeLimitSeconds && (
                            <>
                                <span className="meta-bullet">&bull;</span>
                                <span>Time limit: <strong>{race.timeLimitSeconds}s</strong></span>
                            </>
                        )}
                    </div>
                </div>

                <div className="race-header-actions">
                    {isRunning && (
                        <button
                            type="button"
                            className="btn-pause-race"
                            onClick={handlePause}
                            disabled={busyAction != null}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                            <span>{busyAction === 'pause' ? 'Pausing...' : 'Pause Race'}</span>
                        </button>
                    )}

                    {isPaused && (
                        <button
                            type="button"
                            className="btn-resume-race"
                            onClick={handleResume}
                            disabled={busyAction != null}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            <span>{busyAction === 'resume' ? 'Resuming...' : 'Resume Race'}</span>
                        </button>
                    )}

                    {(isRunning || isPaused) && (
                        <button
                            type="button"
                            className="btn-stop-race"
                            onClick={handleStop}
                            disabled={busyAction != null}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" />
                            </svg>
                            <span>{busyAction === 'stop' ? 'Stopping...' : 'Stop Race'}</span>
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="header-error-banner">{error}</div>}
        </div>
    );
}
