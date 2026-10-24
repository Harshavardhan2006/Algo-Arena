export const ALGORITHM_COLORS = {
    greedy: '#f59e0b',
    branch_and_bound: '#3b82f6',
    dynamic_programming: '#a855f7',
    genetic_algorithm: '#22c55e',
    simulated_annealing: '#14b8a6'
};

export const FALLBACK_PALETTE = ['#ec4899', '#06b6d4', '#8b5cf6', '#eab308', '#f97316', '#10b981'];

export function getAlgorithmColor(code, index = 0) {
    if (code && ALGORITHM_COLORS[code]) {
        return ALGORITHM_COLORS[code];
    }
    return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

const intFormatter = new Intl.NumberFormat('en-US');

export function formatInt(val) {
    if (val == null) return '-';
    return intFormatter.format(val);
}

export function formatScore(val) {
    if (val == null) return '-';
    if (Number.isInteger(val)) {
        return intFormatter.format(val);
    }
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val);
}

export function formatGap(score, baseline) {
    if (score == null || baseline == null) return '-';
    if (score === baseline) return '0.00%';
    const pct = ((score - baseline) / baseline) * 100;
    if (pct > 0) {
        const str = pct.toFixed(2);
        return str === '0.00' ? '+0.01%' : `+${str}%`;
    }
    return `${pct.toFixed(2)}%`;
}

export function humanizeKey(key) {
    if (!key) return '';
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}
