import { useState } from 'react';
import { createRace, uploadDataset } from '../api.js';

const SAMPLE = [
    { id: 1, duration: 5 },
    { id: 2, duration: 3 },
    { id: 3, duration: 8 },
    { id: 4, duration: 2 }
];

function randomJobs(count) {
    return Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        duration: 5 + Math.floor(Math.random() * 56)
    }));
}

export default function DatasetForm({ onRaceCreated }) {
    const [name, setName] = useState('My scheduling problem');
    const [machineCount, setMachineCount] = useState(2);
    const [jobsText, setJobsText] = useState(JSON.stringify(SAMPLE, null, 2));
    const [randomCount, setRandomCount] = useState(20);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    function fillRandom() {
        setJobsText(JSON.stringify(randomJobs(Number(randomCount)), null, 2));
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
            const race = await createRace(dataset.id);
            onRaceCreated(race.raceId);
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <form className="card" onSubmit={submit}>
            <h2>New scheduling race</h2>
            <label>
                Dataset name
                <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
                Machines
                <input type="number" min="1" value={machineCount} onChange={(e) => setMachineCount(e.target.value)} />
            </label>
            <label>
                Jobs (JSON array of id and duration)
                <textarea rows={10} value={jobsText} onChange={(e) => setJobsText(e.target.value)} />
            </label>
            <div className="row">
                <input
                    type="number"
                    min="1"
                    max="200"
                    value={randomCount}
                    onChange={(e) => setRandomCount(e.target.value)}
                />
                <button type="button" className="secondary" onClick={fillRandom}>Fill with random jobs</button>
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={busy}>{busy ? 'Preparing...' : 'Start race'}</button>
        </form>
    );
}