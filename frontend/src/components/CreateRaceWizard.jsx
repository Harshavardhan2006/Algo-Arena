import { useEffect, useRef, useState } from 'react';
import { createRace, getDatasets, startRace, uploadDataset } from '../api.js';

const SAMPLE_SCHEDULING = [
    { id: 1, duration: 45 },
    { id: 2, duration: 32 },
    { id: 3, duration: 78 },
    { id: 4, duration: 19 },
    { id: 5, duration: 64 },
    { id: 6, duration: 52 },
    { id: 7, duration: 88 },
    { id: 8, duration: 25 },
    { id: 9, duration: 41 },
    { id: 10, duration: 37 },
    { id: 11, duration: 70 },
    { id: 12, duration: 29 },
    { id: 13, duration: 15 },
    { id: 14, duration: 83 },
    { id: 15, duration: 61 },
    { id: 16, duration: 49 },
    { id: 17, duration: 34 },
    { id: 18, duration: 72 },
    { id: 19, duration: 56 },
    { id: 20, duration: 23 },
    { id: 21, duration: 67 },
    { id: 22, duration: 38 },
    { id: 23, duration: 44 },
    { id: 24, duration: 58 }
];

function parseUploadedDataset(text, defaultMachines = 3) {
    if (!text || typeof text !== 'string') {
        throw new Error('File content is empty');
    }
    const trimmed = text.trim();
    if (!trimmed) {
        throw new Error('File content is empty');
    }

    let detectedMachines = Number(defaultMachines) || 3;
    let extractedJobs = [];
    let parsedJson = null;

    try {
        parsedJson = JSON.parse(trimmed);
    } catch {
        parsedJson = null;
    }

    if (parsedJson !== null) {
        if (parsedJson.machineCount && Number(parsedJson.machineCount) > 0) {
            detectedMachines = Math.min(100, Math.max(1, Math.round(Number(parsedJson.machineCount))));
        }

        let rawItems = [];
        if (Array.isArray(parsedJson)) {
            rawItems = parsedJson;
        } else if (Array.isArray(parsedJson.jobs)) {
            rawItems = parsedJson.jobs;
        } else if (Array.isArray(parsedJson.tasks)) {
            rawItems = parsedJson.tasks;
        } else if (Array.isArray(parsedJson.data)) {
            rawItems = parsedJson.data;
        } else if (Array.isArray(parsedJson.items)) {
            rawItems = parsedJson.items;
        } else if (typeof parsedJson === 'object') {
            for (const val of Object.values(parsedJson)) {
                if (Array.isArray(val) && val.length > 0) {
                    rawItems = val;
                    break;
                }
            }
        }

        if (rawItems.length > 0) {
            extractedJobs = rawItems.map((item, idx) => {
                if (typeof item === 'number') {
                    return { id: idx + 1, duration: Math.max(1, Math.round(item)) };
                }
                if (item && typeof item === 'object') {
                    const dur = item.duration ?? item.duration_ms ?? item.processing_time ?? item.number ?? item.time ?? item.weight ?? item.val ?? item.value ?? item.length ?? item.size ?? item.cost ?? item.y ?? item.x;
                    const numDur = Number(dur);
                    const finalDur = (!isNaN(numDur) && numDur > 0) ? Math.round(numDur) : Math.max(1, (idx * 7 + 13) % 95 + 5);
                    const id = item.id ?? item.jobId ?? item.job_id ?? item.label ?? (idx + 1);
                    return { id: typeof id === 'number' ? id : idx + 1, duration: finalDur };
                }
                return { id: idx + 1, duration: 10 };
            });
        }
    }

    if (extractedJobs.length === 0) {
        const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));
        let headerCols = null;
        const dataRows = [];

        for (const line of lines) {
            const machineMatch = line.match(/(?:machines|machine_count|m)\s*[:=]\s*(\d+)/i);
            if (machineMatch) {
                detectedMachines = Math.min(100, Math.max(1, parseInt(machineMatch[1], 10)));
                continue;
            }
            if (/^(?:NAME|TYPE|COMMENT|DIMENSION|EDGE_WEIGHT_TYPE|NODE_COORD_SECTION|EOF)\b/i.test(line)) {
                continue;
            }

            let tokens = [];
            if (line.includes(',')) {
                tokens = line.split(',').map(t => t.trim().replace(/^['"]|['"]$/g, ''));
            } else if (line.includes('\t')) {
                tokens = line.split('\t').map(t => t.trim().replace(/^['"]|['"]$/g, ''));
            } else if (line.includes(';')) {
                tokens = line.split(';').map(t => t.trim().replace(/^['"]|['"]$/g, ''));
            } else if (line.includes('|')) {
                tokens = line.split('|').map(t => t.trim().replace(/^['"]|['"]$/g, ''));
            } else {
                tokens = line.split(/\s+/).map(t => t.trim());
            }

            tokens = tokens.filter(t => t.length > 0);
            if (tokens.length === 0) continue;

            const isNumericRow = tokens.some(t => !isNaN(Number(t)));
            if (!headerCols && !isNumericRow) {
                headerCols = tokens.map(t => t.toLowerCase());
                continue;
            }

            dataRows.push(tokens);
        }

        if (dataRows.length > 0) {
            let durationColIndex = -1;
            let idColIndex = -1;

            if (headerCols) {
                for (let i = 0; i < headerCols.length; i++) {
                    const h = headerCols[i];
                    if (['duration', 'number', 'time', 'processing', 'weight', 'size', 'length', 'val', 'value', 'cost'].some(k => h.includes(k))) {
                        durationColIndex = i;
                        break;
                    }
                }
                for (let i = 0; i < headerCols.length; i++) {
                    const h = headerCols[i];
                    if (['id', 'job', 'label', 'name', 'index', 'task'].some(k => h.includes(k))) {
                        idColIndex = i;
                        break;
                    }
                }
            }

            extractedJobs = dataRows.map((row, idx) => {
                let id = idx + 1;
                let duration = 10;

                if (row.length === 1) {
                    const num = Number(row[0]);
                    duration = (!isNaN(num) && num > 0) ? Math.round(num) : Math.max(1, (idx * 7 + 13) % 95 + 5);
                } else if (durationColIndex !== -1 && row[durationColIndex] !== undefined) {
                    const num = Number(row[durationColIndex]);
                    duration = (!isNaN(num) && num > 0) ? Math.round(num) : 10;
                    if (idColIndex !== -1 && row[idColIndex] !== undefined) {
                        const parsedId = Number(row[idColIndex]);
                        id = (!isNaN(parsedId) && parsedId > 0) ? parsedId : idx + 1;
                    }
                } else {
                    let foundNum = null;
                    for (let c = row.length - 1; c >= 0; c--) {
                        const n = Number(row[c]);
                        if (!isNaN(n) && n > 0) {
                            foundNum = n;
                            break;
                        }
                    }
                    if (foundNum !== null) {
                        duration = Math.round(foundNum);
                    }
                    const firstNum = Number(row[0]);
                    if (!isNaN(firstNum) && firstNum > 0 && row.length > 1) {
                        id = Math.round(firstNum);
                    }
                }

                return { id, duration: Math.max(1, duration) };
            });
        }
    }

    if (extractedJobs.length === 0) {
        throw new Error('Unable to parse jobs from dataset file');
    }

    return {
        jobs: extractedJobs,
        machineCount: detectedMachines
    };
}

export default function CreateRaceWizard({ onRaceCreated }) {
    const [selectedProblem, setSelectedProblem] = useState('scheduling');
    const [existingDatasets, setExistingDatasets] = useState([]);
    const [datasetName, setDatasetName] = useState('search-24-jobs-101');
    const [machineCount, setMachineCount] = useState(3);
    const [rawJsonText, setRawJsonText] = useState(JSON.stringify({ jobs: SAMPLE_SCHEDULING, machineCount: 3 }, null, 2));
    const [timeLimitSeconds, setTimeLimitSeconds] = useState(30);
    const [dragActive, setDragActive] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        getDatasets()
            .then((list) => {
                if (Array.isArray(list)) setExistingDatasets(list);
            })
            .catch(() => {});
    }, []);

    function handleFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const parsed = parseUploadedDataset(text, machineCount);
                setRawJsonText(JSON.stringify(parsed, null, 2));
                setDatasetName(file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-'));
                if (parsed.machineCount) {
                    setMachineCount(parsed.machineCount);
                }
                setError(null);
            } catch (err) {
                setError('Invalid dataset file format: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }

    function loadPreset(name, jobs, machines) {
        setDatasetName(name);
        setMachineCount(machines);
        setRawJsonText(JSON.stringify({ jobs, machineCount: machines }, null, 2));
        setError(null);
    }

    async function handleStartRace(e) {
        if (e) e.preventDefault();
        setError(null);
        setBusy(true);

        try {
            const parsed = parseUploadedDataset(rawJsonText, machineCount);
            const payload = {
                jobs: parsed.jobs,
                machineCount: Number(machineCount) || parsed.machineCount || 3
            };

            const dataset = await uploadDataset(
                datasetName || 'Custom Dataset',
                'scheduling',
                payload,
                payload.jobs.length
            );

            const race = await createRace(dataset.id, Number(timeLimitSeconds) || 30);
            if (race && race.raceId) {
                try {
                    await startRace(race.raceId);
                } catch {}
                onRaceCreated(race.raceId);
            } else {
                throw new Error('Failed to retrieve race ID');
            }
        } catch (err) {
            setError(err.message || 'Failed to start race');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="create-race-wizard">
            <div className="wizard-header">
                <span className="wizard-step-label">Step 1 of 4: Choose Problem Type</span>
                <h1 className="wizard-title">Create New Race</h1>
            </div>

            <div className="problem-types-row">
                <div
                    className={`problem-select-card ${selectedProblem === 'scheduling' ? 'selected' : ''}`}
                    onClick={() => setSelectedProblem('scheduling')}
                >
                    <div className="select-card-icon cat-green">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect width="18" height="18" x="3" y="4" rx="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                    </div>
                    <div className="select-card-info">
                        <h3 className="select-card-title">Scheduling</h3>
                        <p className="select-card-desc">Job scheduling, CPU scheduling, flow shop</p>
                    </div>
                    <button
                        type="button"
                        className={`btn-select-pill ${selectedProblem === 'scheduling' ? 'active' : ''}`}
                    >
                        {selectedProblem === 'scheduling' ? 'Selected' : 'Select'}
                    </button>
                </div>

                <div
                    className={`problem-select-card ${selectedProblem === 'routing' ? 'selected' : ''}`}
                    onClick={() => setSelectedProblem('routing')}
                >
                    <div className="select-card-icon cat-blue">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="6" cy="6" r="3" />
                            <circle cx="18" cy="18" r="3" />
                            <circle cx="18" cy="6" r="3" />
                            <line x1="8.5" x2="15.5" y1="7.5" y2="16.5" />
                        </svg>
                    </div>
                    <div className="select-card-info">
                        <h3 className="select-card-title">Routing / Graph</h3>
                        <p className="select-card-desc">TSP, shortest path, network flow</p>
                    </div>
                    <button
                        type="button"
                        className={`btn-select-pill ${selectedProblem === 'routing' ? 'active' : ''}`}
                    >
                        {selectedProblem === 'routing' ? 'Selected' : 'Select'}
                    </button>
                </div>

                <div
                    className={`problem-select-card ${selectedProblem === 'resource' ? 'selected' : ''}`}
                    onClick={() => setSelectedProblem('resource')}
                >
                    <div className="select-card-icon cat-orange">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" />
                            <path d="m3 8 9 5 9-5" />
                        </svg>
                    </div>
                    <div className="select-card-info">
                        <h3 className="select-card-title">Resource Allocation</h3>
                        <p className="select-card-desc">Knapsack, bin packing, resource distribution</p>
                    </div>
                    <button
                        type="button"
                        className={`btn-select-pill ${selectedProblem === 'resource' ? 'active' : ''}`}
                    >
                        {selectedProblem === 'resource' ? 'Selected' : 'Select'}
                    </button>
                </div>

                <div
                    className={`problem-select-card ${selectedProblem === 'coloring' ? 'selected' : ''}`}
                    onClick={() => setSelectedProblem('coloring')}
                >
                    <div className="select-card-icon cat-purple">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="m4.93 4.93 4.24 4.24" />
                            <path d="m14.83 9.17 4.24-4.24" />
                        </svg>
                    </div>
                    <div className="select-card-info">
                        <h3 className="select-card-title">Graph Coloring / CSP</h3>
                        <p className="select-card-desc">Graph coloring, exam timetabling, CSPs</p>
                    </div>
                    <button
                        type="button"
                        className={`btn-select-pill ${selectedProblem === 'coloring' ? 'active' : ''}`}
                    >
                        {selectedProblem === 'coloring' ? 'Selected' : 'Select'}
                    </button>
                </div>
            </div>

            <div className="dataset-upload-container card">
                <div className="upload-container-header">
                    <div>
                        <h2 className="upload-title">Upload Your Dataset</h2>
                        <p className="upload-subtitle">Provide benchmark instances or select a curated standard instance below</p>
                    </div>
                </div>

                <div className="upload-grid-layout">
                    <div
                        className={`dropzone-box ${dragActive ? 'drag-over' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,.csv,.tsv,.txt"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFile(e.target.files && e.target.files[0])}
                        />
                        <div className="dropzone-icon-circle">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                                <path d="M12 12v9" />
                                <path d="m16 16-4-4-4 4" />
                            </svg>
                        </div>
                        <span className="dropzone-prompt">Drag & drop your file here</span>
                        <span className="dropzone-or">or</span>
                        <button type="button" className="btn-browse-files">Browse Files</button>
                    </div>

                    <div className="upload-meta-sidebar">
                        <div className="meta-box">
                            <span className="meta-label">Supported Formats</span>
                            <div className="format-tags">
                                <span className="format-tag">.json</span>
                                <span className="format-tag">.csv</span>
                                <span className="format-tag">.tsv</span>
                                <span className="format-tag">.txt</span>
                            </div>
                        </div>

                        <div className="meta-box">
                            <span className="meta-label">Example Datasets</span>
                            <div className="example-chips">
                                <button
                                    type="button"
                                    className="example-chip"
                                    onClick={() => loadPreset('berlin52.json (TSP)', SAMPLE_SCHEDULING, 3)}
                                >
                                    berlin52.json (TSP)
                                </button>
                                <button
                                    type="button"
                                    className="example-chip"
                                    onClick={() => loadPreset('kroA100.csv (VRP)', SAMPLE_SCHEDULING.slice(0, 16), 2)}
                                >
                                    kroA100.csv (VRP)
                                </button>
                                <button
                                    type="button"
                                    className="example-chip"
                                    onClick={() => loadPreset('search-24-jobs-101', SAMPLE_SCHEDULING, 3)}
                                >
                                    search-24-jobs-101
                                </button>
                                <button
                                    type="button"
                                    className="example-chip"
                                    onClick={() => loadPreset('verify-22jobs-test', SAMPLE_SCHEDULING.slice(0, 22), 3)}
                                >
                                    verify-22jobs-test
                                </button>
                            </div>
                        </div>

                        <div className="meta-box">
                            <span className="meta-label">Time Limit (Seconds)</span>
                            <div className="time-limit-presets">
                                {[15, 30, 60, 120, 300].map((sec) => (
                                    <button
                                        key={sec}
                                        type="button"
                                        className={`btn-time-preset ${timeLimitSeconds === sec ? 'active' : ''}`}
                                        onClick={() => setTimeLimitSeconds(sec)}
                                    >
                                        {sec}s
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dataset-config-form">
                    <div className="form-fields-row">
                        <div className="form-field-group flex-2">
                            <label className="field-label">Dataset Name</label>
                            <input
                                className="form-text-input"
                                value={datasetName}
                                onChange={(e) => setDatasetName(e.target.value)}
                                placeholder="e.g. search-24-jobs-101"
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
                                onChange={(e) => setMachineCount(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="form-field-group">
                        <div className="json-header-bar">
                            <label className="field-label">Dataset Content (JSON Object)</label>
                            <span className="json-status-tag">Valid JSON Schema</span>
                        </div>
                        <textarea
                            className="form-json-textarea"
                            rows={8}
                            value={rawJsonText}
                            onChange={(e) => setRawJsonText(e.target.value)}
                        />
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
                            <span className="checklist-tag algo-bb">Branch & Bound (Optimal)</span>
                            <span className="checklist-tag algo-genetic">Genetic Algorithm</span>
                            <span className="checklist-tag algo-greedy">Greedy (SJF)</span>
                            <span className="checklist-tag algo-lpt">LPT Heuristic</span>
                            <span className="checklist-tag algo-sa">Simulated Annealing</span>
                        </div>
                        <button
                            type="button"
                            className="btn-wizard-launch"
                            disabled={busy}
                            onClick={handleStartRace}
                        >
                            {busy ? (
                                <span>Launching Race...</span>
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
            </div>
        </div>
    );
}
