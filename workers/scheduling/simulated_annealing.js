const fs = require('fs');

function readInput() {
    let raw;
    const arg = process.argv[2];
    if (arg && arg !== '-') {
        raw = fs.readFileSync(arg, 'utf8');
    } else {
        raw = fs.readFileSync(0, 'utf8');
    }
    raw = raw.trim();
    if (!raw) {
        throw new Error('No input provided via argument or stdin');
    }
    try {
        return JSON.parse(raw);
    } catch {
        for (const line of raw.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (trimmed) {
                try {
                    return JSON.parse(trimmed);
                } catch {}
            }
        }
        throw new Error('Failed to parse input as JSON or NDJSON');
    }
}

try {
    const input = readInput();
    console.log(JSON.stringify({ type: 'ready' }));
    const begin = process.hrtime.bigint();
    let emitNs = 0n;

    function emit(event) {
        const before = process.hrtime.bigint();
        console.log(JSON.stringify(event));
        emitNs += process.hrtime.bigint() - before;
    }

    const machineCount = Math.max(1, Number(input.machineCount) || 3);
    const jobs = Array.isArray(input.jobs) ? input.jobs : [];
    const n = jobs.length;

    if (n === 0) {
        const computeMs = Number(process.hrtime.bigint() - begin - emitNs) / 1e6;
        console.log(JSON.stringify({
            type: 'final',
            iteration: 0,
            score: 0,
            computeMs,
            progress: 1,
            stats: { steps: 0, bestScore: 0 },
            payload: { assignment: [], machineLoad: new Array(machineCount).fill(0) }
        }));
        process.exit(0);
    }

    const currentChrome = new Array(n);
    const load = new Array(machineCount).fill(0);

    const sorted = jobs.map((j, idx) => ({ idx, duration: j.duration })).sort((a, b) => b.duration - a.duration);
    for (const item of sorted) {
        let bestM = 0;
        for (let m = 1; m < machineCount; m++) {
            if (load[m] < load[bestM]) bestM = m;
        }
        currentChrome[item.idx] = bestM;
        load[bestM] += item.duration;
    }

    let currentScore = Math.max(...load);
    let bestScore = currentScore;
    let bestChrome = currentChrome.slice();

    const steps = Math.min(800, Math.max(150, n * 20));
    let temp = 1000.0;
    const cooling = 0.985;
    let lastReportTime = Date.now();

    emit({
        type: 'progress',
        iteration: 0,
        score: bestScore,
        progress: 0.05,
        stats: { step: 0, temperature: temp, bestScore }
    });

    for (let step = 1; step <= steps; step++) {
        const jobIdx = Math.floor(Math.random() * n);
        const oldM = currentChrome[jobIdx];
        let newM = Math.floor(Math.random() * machineCount);
        if (newM === oldM) newM = (oldM + 1) % machineCount;

        load[oldM] -= jobs[jobIdx].duration;
        load[newM] += jobs[jobIdx].duration;
        const newScore = Math.max(...load);

        const delta = newScore - currentScore;
        if (delta <= 0 || Math.random() < Math.exp(-delta / temp)) {
            currentChrome[jobIdx] = newM;
            currentScore = newScore;
            if (currentScore < bestScore) {
                bestScore = currentScore;
                bestChrome = currentChrome.slice();
            }
        } else {
            load[oldM] += jobs[jobIdx].duration;
            load[newM] -= jobs[jobIdx].duration;
        }

        temp *= cooling;

        const now = Date.now();
        if (step === steps || now - lastReportTime >= 250) {
            lastReportTime = now;
            emit({
                type: 'progress',
                iteration: step,
                score: bestScore,
                progress: Number((step / steps).toFixed(2)),
                stats: { step, temperature: Number(temp.toFixed(2)), bestScore }
            });
        }
    }

    const finalLoad = new Array(machineCount).fill(0);
    const assignment = [];
    for (let i = 0; i < n; i++) {
        const m = bestChrome[i];
        assignment.push({ jobId: jobs[i].id, machine: m, startTime: finalLoad[m] });
        finalLoad[m] += jobs[i].duration;
    }

    const computeMs = Number(process.hrtime.bigint() - begin - emitNs) / 1e6;

    console.log(JSON.stringify({
        type: 'final',
        iteration: steps,
        score: bestScore,
        computeMs,
        progress: 1,
        stats: { steps, bestScore },
        payload: { assignment, machineLoad: finalLoad }
    }));
} catch (err) {
    console.error(err.message || String(err));
    process.exit(1);
}
