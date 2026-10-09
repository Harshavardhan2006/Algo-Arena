const fs = require('fs');

const started = process.hrtime.bigint();

const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const machineCount = input.machineCount;
const jobs = [...input.jobs].sort((a, b) => b.duration - a.duration);
const n = jobs.length;

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

function report() {
    console.log(JSON.stringify({
        type: 'progress',
        iteration: nodes,
        score: best,
        payload: { nodes }
    }));
}

report();

function search(index, load, assignment) {
    if (best <= lowerBound) return;
    nodes++;
    if (nodes % 20000 === 0) report();

    if (index === n) {
        const makespan = Math.max(...load);
        if (makespan < best) {
            best = makespan;
            bestAssignment = assignment.slice();
            report();
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

const computeMs = Number(process.hrtime.bigint() - started) / 1e6;

console.log(JSON.stringify({
    type: 'final',
    iteration: nodes,
    score: best,
    computeMs,
    payload: { assignment: bestAssignment, nodes }
}));