const fs = require('fs');

const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const begin = process.hrtime.bigint();
let emitNs = 0n;
function emit(event) {
    const before = process.hrtime.bigint();
    console.log(JSON.stringify(event));
    emitNs += process.hrtime.bigint() - before;
}
const machineCount = input.machineCount;
const jobs = [...input.jobs].sort((a, b) => a.duration - b.duration);

const load = new Array(machineCount).fill(0);
const assignment = [];

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
        payload: { jobId: job.id, machine: target }
    });
});

const computeMs = Number(process.hrtime.bigint() - begin - emitNs) / 1e6;

console.log(JSON.stringify({
    type: 'final',
    iteration: jobs.length,
    score: Math.max(...load),
    computeMs,
    payload: { assignment, machineLoad: load }
}));