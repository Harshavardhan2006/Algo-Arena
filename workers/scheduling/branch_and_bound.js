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
        ? [...input.jobs].sort((a, b) => b.duration - a.duration)
        : [];
    const n = jobs.length;

    if (n === 0) {
        const computeMs = Number(process.hrtime.bigint() - begin - emitNs) / 1e6;
        console.log(JSON.stringify({
            type: 'final',
            iteration: 0,
            score: 0,
            computeMs,
            stats: { nodes: 0, lowerBound: 0 },
            payload: { assignment: [], nodes: 0 }
        }));
        process.exit(0);
    }

    const startLoad = new Array(machineCount).fill(0);
    const startAssignment = jobs.map((job) => {
        let target = 0;
        for (let m = 1; m < machineCount; m++) {
            if (startLoad[m] < startLoad[target]) target = m;
        }
        const placed = { jobId: job.id, machine: target, startTime: startLoad[target] };
        startLoad[target] += job.duration;
        return placed;
    });

    let best = Math.max(...startLoad);
    let bestAssignment = startAssignment;
    let nodes = 0;

    const totalWork = jobs.reduce((sum, job) => sum + job.duration, 0);
    const lowerBound = Math.max(jobs[0].duration, totalWork / machineCount);

    let lastReport = 0;

    function report(force = false) {
        const now = Date.now();
        if (!force && now - lastReport < 250) return;
        lastReport = now;
        emit({
            type: 'progress',
            iteration: nodes,
            score: best,
            stats: { nodes, lowerBound }
        });
    }

    report(true);

    function search(index, load, assignment) {
        if (best <= lowerBound) return;
        nodes++;
        if (nodes % 20000 === 0) report(false);

        if (index === n) {
            const makespan = Math.max(...load);
            if (makespan < best) {
                best = makespan;
                bestAssignment = assignment.slice();
                report(false);
            }
            return;
        }

        if (Math.max(...load) >= best) return;

        const job = jobs[index];
        const seen = new Set();
        for (let m = 0; m < machineCount; m++) {
            if (seen.has(load[m])) continue;
            seen.add(load[m]);
            assignment.push({ jobId: job.id, machine: m, startTime: load[m] });
            load[m] += job.duration;
            search(index + 1, load, assignment);
            load[m] -= job.duration;
            assignment.pop();
        }
    }

    search(0, new Array(machineCount).fill(0), []);

    const computeMs = Number(process.hrtime.bigint() - begin - emitNs) / 1e6;

    console.log(JSON.stringify({
        type: 'final',
        iteration: nodes,
        score: best,
        computeMs,
        stats: { nodes, lowerBound },
        payload: { assignment: bestAssignment, nodes }
    }));
} catch (err) {
    console.error(err.message || String(err));
    process.exit(1);
}
