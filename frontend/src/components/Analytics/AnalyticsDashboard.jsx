import React, { useState, useMemo, useContext } from "react";
import { FinanceContext } from "../../context/FinanceContext";
import { generateInsights } from "../../utils/insightEngine";
import NormalAnalytics from "./NormalAnalytics";
import AIInsights from "./AIInsights";
import { Sparkles, BarChart2 } from "lucide-react";

/**
 * AnalyticsDashboard: Hybrid container for Normal vs AI Insights mode.
 */
const AnalyticsDashboard = () => {
    const [mode, setMode] = useState("normal"); // "normal" | "ai"
    const { metrics, rollingMetrics, transactions, goals } = useContext(FinanceContext);

    // AI Insight memoization
    const { health, insights } = useMemo(() => {
        return generateInsights(metrics, transactions, goals, rollingMetrics);
    }, [metrics, transactions, goals, rollingMetrics]);

    return (
        <div className="space-y-6">
            {/* Mode Switcher */}
            <div className="flex justify-center">
                <div className="inline-flex p-1 bg-zinc-900/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl">
                    <button
                        onClick={() => setMode("normal")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            mode === "normal"
                                ? "bg-zinc-100 text-zinc-950 shadow-lg"
                                : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        <BarChart2 className="w-4 h-4" />
                        <span>Normal</span>
                    </button>
                    <button
                        onClick={() => setMode("ai")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            mode === "ai"
                                ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                                : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>AI Insights</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="transition-all duration-500 transform animate-in fade-in slide-in-from-bottom-4">
                {mode === "normal" ? (
                    <NormalAnalytics switchMode={() => setMode("ai")} topInsight={insights[0]} />
                ) : (
                    <AIInsights health={health} insights={insights} />
                )}
            </div>
        </div>
    );
};

export default React.memo(AnalyticsDashboard);
