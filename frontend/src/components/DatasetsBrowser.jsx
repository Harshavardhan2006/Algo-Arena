import { useEffect, useState } from 'react';
import { createRace, getDatasets } from '../api.js';

export default function DatasetsBrowser({ onLaunchRace }) {
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDataset, setSelectedDataset] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        getDatasets()
            .then((list) => {
                if (Array.isArray(list)) {
                    setDatasets(list);
                    if (list.length > 0) setSelectedDataset(list[0]);
                }
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    async function handleQuickRace(datasetId) {
        setBusyId(datasetId);
        setError(null);
        try {
            const race = await createRace(datasetId, 30);
            if (race && race.raceId && onLaunchRace) {
                onLaunchRace(race.raceId);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="datasets-browser-container">
            <div className="leaderboards-header-box">
                <div>
                    <h1 className="leaderboards-title">Datasets & Benchmark Instances</h1>
                    <p className="leaderboards-subtitle">
                        Standard and user-uploaded problem instances ready for algorithmic execution
                    </p>
                </div>
            </div>

            {error && (
                <div className="wizard-error-banner">
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="loading-state card">Loading benchmark datasets...</div>
            ) : (
                <div className="datasets-grid-layout">
                    <div className="datasets-list-col card">
                        <h3 className="section-heading-sm">Available Datasets ({datasets.length})</h3>
                        <div className="datasets-scroll-list">
                            {datasets.map((d) => (
                                <div
                                    key={d.id}
                                    className={`dataset-item-row ${selectedDataset?.id === d.id ? 'active' : ''}`}
                                    onClick={() => setSelectedDataset(d)}
                                >
                                    <div className="dataset-item-left">
                                        <div className="dataset-item-name">{d.name}</div>
                                        <div className="dataset-item-tags">
                                            <span className="dataset-tag-type">{d.problemType?.code || 'scheduling'}</span>
                                            <span className="dataset-tag-size">{d.sizeMetric || d.rawInput?.jobs?.length || 0} jobs</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-launch-sm"
                                        disabled={busyId === d.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickRace(d.id);
                                        }}
                                    >
                                        {busyId === d.id ? 'Starting...' : 'Race'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="dataset-details-col card">
                        {selectedDataset ? (
                            <div className="dataset-inspect-box">
                                <div className="inspect-header">
                                    <div>
                                        <h2 className="inspect-title">{selectedDataset.name}</h2>
                                        <div className="inspect-meta">
                                            <span>Problem Type: <strong>{selectedDataset.problemType?.name || selectedDataset.problemType?.code}</strong></span>
                                            <span className="meta-bullet">&bull;</span>
                                            <span>Size Metric: <strong>{selectedDataset.sizeMetric}</strong></span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-hero-primary"
                                        disabled={busyId === selectedDataset.id}
                                        onClick={() => handleQuickRace(selectedDataset.id)}
                                    >
                                        {busyId === selectedDataset.id ? 'Starting Race...' : 'Start Race on Dataset'}
                                    </button>
                                </div>

                                <div className="inspect-body">
                                    <label className="field-label">Raw Instance JSON Payload</label>
                                    <pre className="inspect-json">
                                        {JSON.stringify(selectedDataset.rawInput, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-selection muted">Select a dataset to view its configuration</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
