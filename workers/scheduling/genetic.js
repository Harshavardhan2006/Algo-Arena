const fs = require('fs');

const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
console.log(JSON.stringify({ type: 'ready' }));
const begin = process.hrtime.bigint();
let emitNs = 0n;
function emit(event) {
    const before = process.hrtime.bigint();
    console.log(JSON.stringify(event));
    emitNs += process.hrtime.bigint() - before;
}

const machineCount = input.machineCount || 3;
const jobs = input.jobs;
const n = jobs.length;

function evaluate(chromosome) {
    const load = new Array(machineCount).fill(0);
    for (let i = 0; i < n; i++) {
        load[chromosome[i]] += jobs[i].duration;
    }
    return Math.max(...load);
}

function buildSchedule(chromosome) {
    const load = new Array(machineCount).fill(0);
    const assignment = [];
    for (let i = 0; i < n; i++) {
        const m = chromosome[i];
        assignment.push({ jobId: jobs[i].id, machine: m, startTime: load[m] });
        load[m] += jobs[i].duration;
    }
    return { assignment, machineLoad: load };
}

const popSize = 40;
const generations = Math.min(300, Math.max(80, n * 8));
let population = [];

const lptChrome = new Array(n).fill(0);
const lptLoad = new Array(machineCount).fill(0);
const sortedIndices = jobs.map((j, idx) => ({ idx, duration: j.duration })).sort((a, b) => b.duration - a.duration);
for (const item of sortedIndices) {
    let bestM = 0;
    for (let m = 1; m < machineCount; m++) {
        if (lptLoad[m] < lptLoad[bestM]) bestM = m;
    }
    lptChrome[item.idx] = bestM;
    lptLoad[bestM] += item.duration;
}
population.push({ chromosome: lptChrome, score: Math.max(...lptLoad) });

for (let p = 1; p < popSize; p++) {
    const chrome = new Array(n);
    for (let i = 0; i < n; i++) {
        chrome[i] = Math.floor(Math.random() * machineCount);
    }
    population.push({ chromosome: chrome, score: evaluate(chrome) });
}

population.sort((a, b) => a.score - b.score);
let bestOverall = population[0];

emit({
    type: 'progress',
    iteration: 0,
    score: bestOverall.score,
    progress: 0.05,
    stats: { generation: 0, populationSize: popSize, bestScore: bestOverall.score }
});

let lastReportTime = Date.now();

for (let gen = 1; gen <= generations; gen++) {
    const nextGen = [population[0], population[1]];

    while (nextGen.length < popSize) {
        const t1 = population[Math.floor(Math.random() * (popSize / 2))];
        const t2 = population[Math.floor(Math.random() * (popSize / 2))];
        const parent1 = t1.score <= t2.score ? t1 : t2;

        const t3 = population[Math.floor(Math.random() * popSize)];
        const t4 = population[Math.floor(Math.random() * popSize)];
        const parent2 = t3.score <= t4.score ? t3 : t4;

        const childChrome = new Array(n);
        const split = Math.floor(Math.random() * n);
        for (let i = 0; i < n; i++) {
            childChrome[i] = i < split ? parent1.chromosome[i] : parent2.chromosome[i];
            if (Math.random() < 0.08) {
                childChrome[i] = Math.floor(Math.random() * machineCount);
            }
        }

        nextGen.push({ chromosome: childChrome, score: evaluate(childChrome) });
    }

    nextGen.sort((a, b) => a.score - b.score);
    population = nextGen;

    let updated = false;
    if (population[0].score < bestOverall.score) {
        bestOverall = population[0];
        updated = true;
    }

    const now = Date.now();
    if (updated || gen === generations || now - lastReportTime >= 250) {
        lastReportTime = now;
        emit({
            type: 'progress',
            iteration: gen,
            score: bestOverall.score,
            progress: Number((gen / generations).toFixed(2)),
            stats: { generation: gen, populationSize: popSize, bestScore: bestOverall.score }
        });
    }
}

const computeMs = Number(process.hrtime.bigint() - begin - emitNs) / 1e6;
const schedule = buildSchedule(bestOverall.chromosome);

console.log(JSON.stringify({
    type: 'final',
    iteration: generations,
    score: bestOverall.score,
    computeMs,
    progress: 1,
    stats: { generation: generations, populationSize: popSize, bestScore: bestOverall.score },
    payload: schedule
}));
