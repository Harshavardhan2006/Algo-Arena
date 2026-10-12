import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { startRace } from '../api.js';

const TERMINAL = ['completed', 'failed', 'timed out'];

function socketUrl() {
    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${scheme}://${window.location.host}/ws/websocket`;
}

function statusFor(type, existing) {
    if (type === 'final') return 'completed';
    if (type === 'failed') return 'failed';
    if (type === 'timed_out') return 'timed out';
    return TERMINAL.includes(existing) ? existing : 'running';
}

function byScore(a, b) {
    const left = a[1].score ?? Infinity;
    const right = b[1].score ?? Infinity;
    return left - right;
}

export default function LiveRace({ raceId }) {
    const [runs, setRuns] = useState({});
    const [finished, setFinished] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setRuns({});
        setFinished(false);
        setError(null);

        const apply = (event) => {
            if (event.type === 'race_completed') {
                setFinished(true);
                return;
            }
            setRuns((previous) => {
                const current = previous[event.algorithmCode] || {};
                if (event.type === 'progress' && TERMINAL.includes(current.status)) {
                    return previous;
                }
                return {
                    ...previous,
                    [event.algorithmCode]: {
                        status: statusFor(event.type, current.status),
                        score: event.score ?? current.score,
                        iteration: event.iteration ?? current.iteration,
                        elapsedMs: event.elapsedMs ?? current.elapsedMs,
                        computeMs: event.computeMs ?? current.computeMs
                    }
                };
            });
        };

        let startTimer = null;
        const client = new Client({
            brokerURL: socketUrl(),
            reconnectDelay: 0,
            onConnect: () => {
                client.subscribe(`/topic/race/${raceId}`, (message) => apply(JSON.parse(message.body)));
                startTimer = setTimeout(() => {
                    startRace(raceId).catch((e) => setError(e.message));
                }, 300);
            },
            onStompError: (frame) => setError(frame.headers.message),
            onWebSocketError: () => setError('could not reach the live stream')
        });
        client.activate();

        return () => {
            if (startTimer) clearTimeout(startTimer);
            client.deactivate();
        };
    }, [raceId]);

    const entries = Object.entries(runs).sort(byScore);
    const completed = entries.filter(([, run]) => run.status === 'completed');
    const winner = finished && completed.length > 0 ? completed[0][0] : null;

    return (
        <div className="card">
            <h2>Race #{raceId} {finished ? '- finished' : '- running'}</h2>
            {error && <p className="error">{error}</p>}
            <table>
                <thead>
                    <tr>
                        <th>Algorithm</th>
                        <th>Status</th>
                        <th>Best makespan</th>
                        <th title="Greedy counts jobs placed, branch and bound counts search nodes explored, so values are not comparable across algorithms">Steps</th>
                        <th>Wall time (ms)</th>
                        <th>Compute time (ms)</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map(([code, run]) => (
                        <tr key={code} className={code === winner ? 'winner' : ''}>
                            <td>{code}{code === winner ? ' (best)' : ''}</td>
                            <td>{run.status}</td>
                            <td>{run.score ?? '-'}</td>
                            <td>{run.iteration ?? '-'}</td>
                            <td>{run.elapsedMs ?? '-'}</td>
                            <td>{run.computeMs != null ? run.computeMs.toFixed(1) : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {entries.length === 0 && !error && <p className="muted">Waiting for the algorithms to report in...</p>}
        </div>
    );
}