import { useState } from 'react';
import { stopRace } from '../api.js';

export default function RaceHeader({ race, raceId }) {
    const [stopping, setStopping] = useState(false);
    const [error, setError] = useState(null);

    const isRunning = race?.status === 'running';

    async function handleStop() {
        if (!isRunning || stopping) return;
        setStopping(true);
        setError(null);
        try {
            await stopRace(raceId);
        } catch (e) {
            setError(e.message);
            setStopping(false);
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
                        <span className="race-id">Race #{raceId}</span>
                        {isRunning ? (
                            <span className="badge badge-live">LIVE</span>
                        ) : (
                            <span className={`badge badge-${race?.status || 'pending'}`}>
                                {race?.status || 'pending'}
                            </span>
                        )}
                        <span className="race-dataset-tag">{race?.datasetName || 'Dataset'}</span>
                        <span className="race-problem-tag">{race?.problemType || 'scheduling'}</span>
                    </div>
                    <div className="race-header-sub">
                        <span>Started at: <strong>{startTimeFormatted}</strong></span>
                        {race?.timeLimitSeconds && (
                            <span>Time limit: <strong>{race.timeLimitSeconds}s</strong></span>
                        )}
                    </div>
                </div>
                <div className="race-header-actions">
                    {isRunning && (
                        <button
                            type="button"
                            className="btn-danger"
                            onClick={handleStop}
                            disabled={stopping}
                        >
                            {stopping ? 'Stopping...' : 'Stop race'}
                        </button>
                    )}
                </div>
            </div>
            {error && <div className="header-error-banner">{error}</div>}
        </div>
    );
}
