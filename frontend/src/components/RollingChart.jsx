import React, { useContext } from "react";
import { FinanceContext } from "../context/FinanceContext";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const RollingChart = () => {
    const { rollingMetrics } = useContext(FinanceContext);

    if (!rollingMetrics || rollingMetrics.length === 0) {
        return (
            <div className="h-[350px] flex items-center justify-center bg-card rounded-lg border">
                <p className="text-muted-foreground">Insufficient data for rolling metrics</p>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl p-6 w-full">
            <h3 className="text-2xl font-serif font-bold tracking-tight text-zinc-100 mb-6">Trailing 12-Month Performance</h3>
            <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={rollingMetrics} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 12, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
                        <YAxis
                            yAxisId="left"
                            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                            tick={{ fill: "#a1a1aa", fontSize: 12, fontFamily: "Inter" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickFormatter={(val) => `${val}%`}
                            tick={{ fill: "#a1a1aa", fontSize: 12, fontFamily: "Inter" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(24, 24, 27, 0.4)", // zinc-900/40
                                backdropFilter: "blur(24px)",
                                borderColor: "rgba(255, 255, 255, 0.1)",
                                color: "#f4f4f5",
                                borderRadius: "12px",
                                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)"
                            }}
                            itemStyle={{ color: "#f4f4f5", fontFamily: "JetBrains Mono" }}
                            formatter={(value, name) => {
                                if (name === "Savings Rate") return `${value}%`;
                                return `₹${value.toLocaleString("en-IN")}`;
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px", color: "#a1a1aa", fontSize: "12px" }} />
                        <Bar yAxisId="left" dataKey="income" name="Income" fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar yAxisId="left" dataKey="expense" name="Expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="savingsRate"
                            name="Savings Rate"
                            stroke="var(--color-neutral)"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "var(--color-neutral)", strokeWidth: 2, stroke: "var(--background)" }}
                            activeDot={{ r: 6 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default React.memo(RollingChart);
