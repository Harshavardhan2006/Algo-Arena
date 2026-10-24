import { formatInt, formatScore, humanizeKey } from '../utils.js';

function formatStatValue(val) {
    if (val == null) return '-';
    if (typeof val === 'number') {
        if (Number.isInteger(val)) {
            return formatInt(val);
        }
        return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val);
    }
    if (typeof val === 'boolean') {
        return val ? 'true' : 'false';
    }
    return String(val);
}

export default function AlgorithmDetails({ run, metricName }) {
    if (!run) {
        return (
            <div className="algo-details card">
                <h3>Algorithm Details</h3>
                <div className="muted stream-empty">Select an algorithm to view details</div>
            </div>
        );
    }

    const statsEntries = run.stats && typeof run.stats === 'object' ? Object.entries(run.stats) : [];

    return (
        <div className="algo-details card">
            <div className="algo-details-header">
                <div>
                    <h3>{run.name || run.algorithmCode}</h3>
                    <span className="muted text-sm">{run.paradigm || 'Algorithm'}</span>
                </div>
                <span className={`pill pill-${run.status || 'queued'}`}>
                    {run.status || 'queued'}
                </span>
            </div>

            <div className="details-grid">
                <div className="detail-item">
                    <span className="detail-label">Best {metricName}</span>
                    <span className="detail-value">{formatScore(run.score)}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Iterations</span>
                    <span className="detail-value">{formatInt(run.iterations)}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Wall time</span>
                    <span className="detail-value">
                        {run.elapsedMs != null ? `${formatInt(run.elapsedMs)} ms` : '-'}
                    </span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Compute time</span>
                    <span className="detail-value">
                        {run.computeMs != null ? `${run.computeMs.toFixed(1)} ms` : '-'}
                    </span>
                </div>

                {statsEntries.map(([key, val]) => (
                    <div key={key} className="detail-item">
                        <span className="detail-label">{humanizeKey(key)}</span>
                        <span className="detail-value">{formatStatValue(val)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
