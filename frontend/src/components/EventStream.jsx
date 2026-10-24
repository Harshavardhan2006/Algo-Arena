import { formatScore } from '../utils.js';

function formatElapsedSubsecond(ms) {
    if (ms == null) return '00:00.0';
    const totalSeconds = Math.max(0, ms) / 1000;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const mStr = String(mins).padStart(2, '0');
    const sStr = secs.toFixed(1).padStart(4, '0');
    return `${mStr}:${sStr}`;
}

function getEventMessage(event) {
    const { type, score, progress } = event;
    if (type === 'started') {
        return 'started';
    }
    if (type === 'progress') {
        if (score != null) {
            return `new best ${formatScore(score)}`;
        }
        if (progress != null) {
            return `progress ${Math.round(progress * 100)}%`;
        }
        return 'progress';
    }
    if (type === 'final') {
        return `finished with ${score != null ? formatScore(score) : '-'}`;
    }
    if (type === 'timed_out') {
        return `stopped at the time limit, best ${score != null ? formatScore(score) : 'none'}`;
    }
    if (type === 'cancelled') {
        return `cancelled, best ${score != null ? formatScore(score) : 'none'}`;
    }
    if (type === 'failed') {
        return 'failed';
    }
    return type || 'event';
}

export default function EventStream({ events }) {
    const displayedEvents = events.slice(-60).reverse();

    return (
        <div className="event-stream card">
            <div className="stream-header">
                <h3>Live Event Stream</h3>
                <span className="muted text-xs">Last 60 events</span>
            </div>
            <div className="stream-list monospace">
                {displayedEvents.length === 0 ? (
                    <div className="muted stream-empty">No events yet...</div>
                ) : (
                    displayedEvents.map((e) => (
                        <div key={e.eventId} className="stream-line">
                            <span className="stream-time">{formatElapsedSubsecond(e.elapsedMs)}</span>
                            <span className="stream-algo">{e.algorithmCode}</span>
                            <span className="stream-msg">{getEventMessage(e)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
