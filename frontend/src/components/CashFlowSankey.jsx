import React, { useContext } from "react";
import { FinanceContext } from "../context/FinanceContext";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";

const CashFlowSankey = () => {
    const { metrics } = useContext(FinanceContext);

    // Safely parse metrics
    const income = parseFloat(metrics.income) || 0;
    const investment = parseFloat(metrics.investment) || 0;

    // Aggregate expenses from breakdown or simply split remaining to match total
    const breakdown = metrics.expenseBreakdown || [];
    let mandatory = 0;
    let discretionary = 0;

    if (breakdown.length > 0) {
        breakdown.forEach(item => {
            // Very basic heuristic based on names if they exist, or just dump to discretionary
            if (item.name.toLowerCase().includes("rent") ||
                item.name.toLowerCase().includes("bill") ||
                item.name.toLowerCase().includes("grocery") ||
                item.name.toLowerCase().includes("mandatory")) {
                mandatory += parseFloat(item.value);
            } else {
                discretionary += parseFloat(item.value);
            }
        });
    } else {
        // Fallback if no breakdown
        const totalExpense = parseFloat(metrics.expense) || 0;
        mandatory = totalExpense * 0.6;
        discretionary = totalExpense * 0.4;
    }

    // Generate Sankey data
    // Nodes:
    // 0: Income
    // 1: Mandatory
    // 2: Discretionary
    // 3: Investments
    // 4: Unallocated / Savings (if total expenses + investments < income)

    const unallocated = income - (mandatory + discretionary + investment);

    const data = {
        nodes: [
            { name: "Income", color: "#f4f4f5" }, // Platinum
            { name: "Mandatory", color: "#e11d48" }, // Rose
            { name: "Discretionary", color: "#f43f5e" }, // Rose-Light
            { name: "Investments", color: "#6366f1" }, // Indigo
        ],
        links: [
            { source: 0, target: 1, value: mandatory > 0 ? mandatory : 1, color: "#e11d4833" },
            { source: 0, target: 2, value: discretionary > 0 ? discretionary : 1, color: "#f43f5e33" },
            { source: 0, target: 3, value: investment > 0 ? investment : 1, color: "#6366f133" },
        ]
    };

    if (unallocated > 0) {
        data.nodes.push({ name: "Unallocated", color: "#71717a" });
        data.links.push({ source: 0, target: 4, value: unallocated, color: "#71717a33" });
    }

    if (income === 0 && mandatory === 0 && discretionary === 0 && investment === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl">
                <p className="text-zinc-500 font-serif italic text-lg tracking-wide">Data pipeline inactive...</p>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl p-6">
            <h3 className="text-2xl font-serif font-bold text-zinc-100 mb-6 tracking-tight">Capital Flow</h3>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <Sankey
                        data={data}
                        nodePadding={40}
                        nodeWidth={12}
                        linkCurvature={0.35}
                        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        link={{ stroke: 'rgba(255,255,255,0.05)', strokeOpacity: 0.3 }}
                    >
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
                            formatter={(value) => `₹${value.toLocaleString("en-IN")}`}
                        />
                    </Sankey>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CashFlowSankey;
