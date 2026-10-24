import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { formatScore, getAlgorithmColor } from '../utils.js';

export default function ConvergenceChart({ events, lowestLowerBound }) {
    const scoredEvents = events.filter((e) => e.score != null);

    if (scoredEvents.length === 0) {
        return (
            <div className="chart-card card">
                <h3>Convergence</h3>
                <div className="chart-empty-state">
                    Waiting for the first scored event...
                </div>
            </div>
        );
    }

    const algorithms = Array.from(new Set(scoredEvents.map((e) => e.algorithmCode)));
    const timeMap = new Map();
    const currentScores = {};

    for (const e of scoredEvents) {
        const time = Number(((e.elapsedMs || 0) / 1000).toFixed(2));
        currentScores[e.algorithmCode] = e.score;
        timeMap.set(time, { time, ...currentScores });
    }

    const chartData = Array.from(timeMap.values()).sort((a, b) => a.time - b.time);

    const lastIndexByAlgo = {};
    chartData.forEach((point, idx) => {
        algorithms.forEach((algo) => {
            if (point[algo] != null) {
                lastIndexByAlgo[algo] = idx;
            }
        });
    });

    return (
        <div className="chart-card card">
            <h3>Convergence</h3>
            <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#24304f" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#8392b5"
                            tickFormatter={(t) => `${t}s`}
                            fontSize={12}
                        />
                        <YAxis
                            stroke="#8392b5"
                            domain={['dataMin - 1', 'dataMax + 1']}
                            tickFormatter={(val) =>
                                Intl.NumberFormat('en-US', { notation: 'compact' }).format(val)
                            }
                            fontSize={12}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#121a30',
                                borderColor: '#24304f',
                                borderRadius: 6,
                                color: '#e6ebf5',
                                fontSize: 12
                            }}
                            formatter={(value) => [formatScore(value), '']}
                            labelFormatter={(label) => `Time: ${label}s`}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                        {lowestLowerBound != null && (
                            <ReferenceLine
                                y={lowestLowerBound}
                                stroke="#8392b5"
                                strokeDasharray="4 4"
                                label={{
                                    value: 'lower bound',
                                    fill: '#8392b5',
                                    position: 'insideBottomRight',
                                    fontSize: 11
                                }}
                            />
                        )}
                        {algorithms.map((algo, idx) => {
                            const color = getAlgorithmColor(algo, idx);
                            return (
                                <Line
                                    key={algo}
                                    type="stepAfter"
                                    dataKey={algo}
                                    stroke={color}
                                    strokeWidth={2}
                                    isAnimationActive={false}
                                    dot={(props) => {
                                        if (props.index === lastIndexByAlgo[algo]) {
                                            return (
                                                <circle
                                                    key={`${algo}-${props.index}`}
                                                    cx={props.cx}
                                                    cy={props.cy}
                                                    r={4}
                                                    fill={color}
                                                    stroke="#121a30"
                                                    strokeWidth={2}
                                                />
                                            );
                                        }
                                        return <path key={`${algo}-${props.index}`} d="" />;
                                    }}
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
