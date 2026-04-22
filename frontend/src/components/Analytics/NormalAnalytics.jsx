import React, { useContext, useMemo } from "react";
import { FinanceContext } from "../../context/FinanceContext";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, CircleDollarSign, Sparkles, ChevronRight, Wallet } from "lucide-react";

/**
 * Normal Mode: Comparison Charts + Summary
 */
const NormalAnalytics = ({ switchMode, topInsight }) => {
    const { metrics, rollingMetrics } = useContext(FinanceContext);

    // Add Savings to rollingMetrics for the chart
    const chartData = useMemo(() => {
        return rollingMetrics.map(m => ({
            ...m,
            savings: Math.max(0, parseFloat(m.income) - parseFloat(m.expense))
        }));
    }, [rollingMetrics]);

    const netBalance = (
        parseFloat(metrics.income || 0) - 
        parseFloat(metrics.expense || 0) - 
        parseFloat(metrics.investment || 0)
    ).toFixed(2);

    return (
        <div className="space-y-6">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricBox
                    title="Monthly Income"
                    value={`₹${parseFloat(metrics.income).toLocaleString('en-IN')}`}
                    icon={<ArrowUpRight className="text-emerald-400" />}
                />
                <MetricBox
                    title="Monthly Expenses"
                    value={`₹${parseFloat(metrics.expense).toLocaleString('en-IN')}`}
                    icon={<ArrowDownRight className="text-rose-400" />}
                />
                <MetricBox
                    title="Investments"
                    value={`₹${parseFloat(metrics.investment || 0).toLocaleString('en-IN')}`}
                    icon={<Wallet className="text-indigo-400" />}
                />
                <MetricBox
                    title="Net Balance"
                    value={`₹${parseFloat(netBalance).toLocaleString('en-IN')}`}
                    icon={<CircleDollarSign className="text-amber-400" />}
                />
            </div>

            {/* AI Teaser Card */}
            {topInsight && (
                <button
                    onClick={switchMode}
                    className="w-full flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl group hover:bg-indigo-500/20 transition-all active:scale-[0.99]"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-500 rounded-lg">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Optimization Detected</p>
                            <p className="text-sm font-medium text-zinc-100">{topInsight.title}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                        <span>View Deep Analysis</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </button>
            )}

            {/* Comparison Bar Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-serif tracking-wide font-semibold text-zinc-100 mb-6">Income vs Expense vs Savings</h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 10, bottom: 0, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: "#71717a", fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                                    tick={{ fill: "#71717a", fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#18181b",
                                        borderColor: "rgba(255,255,255,0.1)",
                                        borderRadius: "12px",
                                        color: "#f4f4f5"
                                    }}
                                    formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }} />
                                <Bar dataKey="income" name="Income" fill="#c4b5fd" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="expense" name="Expense" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="savings" name="Savings" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Investment Allocation */}
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">Investment Allocation</h3>
                    <div className="space-y-4">
                        {metrics.investmentBreakdown && metrics.investmentBreakdown.length > 0 ? (
                            metrics.investmentBreakdown.map((item, idx) => (
                                <div key={idx} className="group flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400 group-hover:text-zinc-100 transition-colors">{item.name}</span>
                                        <span className="font-mono text-zinc-100 italic">₹{item.value.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-500 transition-all duration-700" 
                                            style={{ width: `${(item.value / metrics.investment) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                                <Wallet className="w-12 h-12 text-zinc-700 mb-4" />
                                <p className="text-xs text-zinc-500 font-serif italic">No investments logged this month</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricBox = ({ title, value, icon }) => (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
        <div className="flex items-center justify-between mb-3 text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
            <span>{title}</span>
            {icon}
        </div>
        <div className="text-2xl font-mono font-bold text-zinc-100">{value}</div>
    </div>
);

export default React.memo(NormalAnalytics);
