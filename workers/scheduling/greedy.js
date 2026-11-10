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

    const machineCount = Math.max(1, Number(input.machineCount) || 1);
    const jobs = Array.isArray(input.jobs)
        ? [...input.jobs].sort((a, b) => a.duration - b.duration)
        : [];

    const load = new Array(machineCount).fill(0);
    const assignment = [];

    if (jobs.length === 0) {
        const computeMs = Number(process.hrtime.bigint() - begin - emitNs) / 1e6;
        console.log(JSON.stringify({
            type: 'final',
            iteration: 0,
            score: 0,
            computeMs,
            progress: 1,
            stats: { jobsPlaced: 0, totalJobs: 0 },
            payload: { assignment: [], machineLoad: load }
        }));
        process.exit(0);
    }

    jobs.forEach((job, index) => {
        let target = 0;
        for (let m = 1; m < machineCount; m++) {
            if (load[m] < load[target]) target = m;
        }
        assignment.push({ jobId: job.id, machine: target, startTime: load[target] });
        load[target] += job.duration;

        emit({
            type: 'progress',
            iteration: index + 1,
            score: Math.max(...load),
            progress: (index + 1) / jobs.length,
            stats: { jobsPlaced: index + 1, totalJobs: jobs.length }
        });
    });

    const computeMs = Number(process.hrtime.bigint() - begin - emitNs) / 1e6;

    console.log(JSON.stringify({
        type: 'final',
        iteration: jobs.length,
        score: Math.max(...load),
        computeMs,
        progress: 1,
        stats: { jobsPlaced: jobs.length, totalJobs: jobs.length },
        payload: { assignment, machineLoad: load }
    }));
} catch (err) {
    console.error(err.message || String(err));
    process.exit(1);
}
