const fs = require('fs');

const started = process.hrtime.bigint();

const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
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

    console.log(JSON.stringify({
        type: 'progress',
        iteration: index + 1,
        score: Math.max(...load),
        payload: { jobId: job.id, machine: target }
    }));
});

const computeMs = Number(process.hrtime.bigint() - started) / 1e6;

console.log(JSON.stringify({
    type: 'final',
    iteration: jobs.length,
    score: Math.max(...load),
    computeMs,
    payload: { assignment, machineLoad: load }
}));