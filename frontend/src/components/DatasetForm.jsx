import { useState } from 'react';
import { createRace, uploadDataset } from '../api.js';

const SAMPLE = [
    { id: 1, duration: 5 },
    { id: 2, duration: 3 },
    { id: 3, duration: 8 },
    { id: 4, duration: 2 }
];

function randomJobs(count, min, max) {
    return Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        duration: min + Math.floor(Math.random() * (max - min + 1))
    }));
}

export default function DatasetForm({ onRaceCreated }) {
    const [name, setName] = useState('My scheduling problem');
    const [machineCount, setMachineCount] = useState(2);
    const [jobsText, setJobsText] = useState(JSON.stringify(SAMPLE, null, 2));
    const [randomCount, setRandomCount] = useState(20);
    const [difficulty, setDifficulty] = useState('easy');
    const [timeLimitSeconds, setTimeLimitSeconds] = useState(30);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    function fillRandom() {
        const [min, max] = difficulty === 'easy' ? [5, 60] : [1000000, 100000000];
        setJobsText(JSON.stringify(randomJobs(Number(randomCount), min, max), null, 2));
    }

    async function submit(event) {
        event.preventDefault();
        setError(null);
        setBusy(true);
        try {
            const jobs = JSON.parse(jobsText);
            const dataset = await uploadDataset(
                name,
                'scheduling',
                { jobs, machineCount: Number(machineCount) },
                jobs.length
            );
            const race = await createRace(dataset.id, Number(timeLimitSeconds));
            onRaceCreated(race.raceId);
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="create-race-wizard">
            <div className="wizard-header">
                <span className="wizard-step-label">Quick Dataset Setup</span>
                <h1 className="wizard-title">New Scheduling Race</h1>
            </div>

            <form className="dataset-upload-container card" onSubmit={submit}>
                <div className="dataset-config-form">
                    <div className="form-fields-row">
                        <div className="form-field-group flex-2">
                            <label className="field-label">Dataset Name</label>
                            <input
                                className="form-text-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My scheduling problem"
                            />
                        </div>
                        <div className="form-field-group flex-1">
                            <label className="field-label">Machine Count</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                className="form-text-input"
                                value={machineCount}
                                onChange={(e) => setMachineCount(e.target.value)}
                            />
                        </div>
                        <div className="form-field-group flex-1">
                            <label className="field-label">Time Limit (s)</label>
                            <input
                                type="number"
                                min="5"
                                max="600"
                                className="form-text-input"
                                value={timeLimitSeconds}
                                onChange={(e) => setTimeLimitSeconds(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-field-group">
                        <label className="field-label">Jobs JSON Array</label>
                        <textarea
                            className="form-json-textarea"
                            rows={8}
                            value={jobsText}
                            onChange={(e) => setJobsText(e.target.value)}
                        />
                    </div>

                    <div className="random-gen-row">
                        <input
                            type="number"
                            min="1"
                            max="200"
                            className="form-text-input"
                            style={{ width: 80 }}
                            value={randomCount}
                            onChange={(e) => setRandomCount(e.target.value)}
                        />
                        <select
                            className="filter-select"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="easy">Easy (5 to 60)</option>
                            <option value="hard">Hard (1M to 100M)</option>
                        </select>
                        <button type="button" className="btn-browse-files" onClick={fillRandom}>
                            Fill with random jobs
                        </button>
                    </div>

                    {error && (
                        <div className="wizard-error-banner">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" x2="12" y1="8" y2="12" />
                                <line x1="12" x2="12.01" y1="16" y2="16" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="wizard-actions-bar">
                        <div className="algo-checklist">
                            <span className="checklist-label">Algorithms in this race:</span>
                            <span className="checklist-tag algo-bb">Branch & Bound</span>
                            <span className="checklist-tag algo-genetic">Genetic Algorithm</span>
                            <span className="checklist-tag algo-greedy">Greedy (SJF)</span>
                            <span className="checklist-tag algo-lpt">LPT Heuristic</span>
                            <span className="checklist-tag algo-sa">Simulated Annealing</span>
                        </div>
                        <button type="submit" className="btn-wizard-launch" disabled={busy}>
                            {busy ? (
                                <span>Preparing Race...</span>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                                    </svg>
                                    <span>Start Race</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
