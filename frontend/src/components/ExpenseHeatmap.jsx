import React, { useContext, useMemo } from "react";
import { FinanceContext } from "../context/FinanceContext";
import { startOfDay, endOfDay, parseISO } from "date-fns";

const ExpenseHeatmap = () => {
    const { heatmapData, setDateRange } = useContext(FinanceContext);

    const { squares, maxExpense } = useMemo(() => {
        // Generate last 365 days
        const days = [];
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - 364);
        start.setDate(start.getDate() - start.getDay()); // align to Sunday

        const dataMap = new Map();
        if (heatmapData) {
            heatmapData.forEach((d) => {
                dataMap.set(d.date, { expense: d.expense || 0, income: d.income || 0 });
            });
        }

        let maxExp = 1;

        for (let i = 0; i < 371; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            if (d > today) break;

            const dateStr = d.toISOString().split("T")[0];
            const data = dataMap.get(dateStr) || { expense: 0, income: 0 };

            if (data.expense > maxExp) maxExp = data.expense;

            days.push({
                date: dateStr,
                expense: data.expense,
                income: data.income,
                // store the actual Date object for easy filtering later
                dateObj: d
            });
        }

        return { squares: days, maxExpense: maxExp };
    }, [heatmapData]);

    const getColor = (sq) => {
        // As per the requirement: Platinum = Income received
        if (sq.income > 0 && sq.income > sq.expense) return "bg-zinc-100 shadow-[0_0_10px_rgba(255,255,255,0.4)]";
        if (sq.income > 0) return "bg-zinc-100/60"; 

        if (sq.expense === 0) return "bg-zinc-800/20";

        const ratio = sq.expense / maxExpense;
        if (ratio < 0.2) return "bg-rose-950/40"; 
        if (ratio < 0.5) return "bg-rose-700/60";
        if (ratio < 0.8) return "bg-rose-600/80";
        return "bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.3)]"; 
    };

    const handleSquareClick = (sq) => {
        // Parse the UTC date string securely and convert to local start/end of day constraints
        const localDate = parseISO(sq.date);
        setDateRange({
            from: startOfDay(localDate),
            to: endOfDay(localDate)
        });
    };

    return (
        <div className="bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl p-6 w-full">
            <h3 className="text-2xl font-serif font-bold text-zinc-100 mb-6 tracking-tight">Financial Heatmap (365 Days)</h3>
            <div className="overflow-x-auto pb-2">
                <div
                    className="grid gap-[3px]"
                    style={{
                        gridTemplateColumns: "repeat(53, minmax(0, 1fr))",
                        gridTemplateRows: "repeat(7, minmax(0, 1fr))",
                        width: "max-content"
                    }}
                >
                    {squares.map((sq, i) => (
                        <div
                            key={i}
                            title={`${sq.date} | Income: ₹${sq.income.toLocaleString("en-IN")} | Expense: ₹${sq.expense.toLocaleString("en-IN")}`}
                            onClick={() => handleSquareClick(sq)}
                            className={`w-3.5 h-3.5 rounded-[2px] transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-zinc-100 ${getColor(sq)}`}
                        />
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between mt-6 text-[10px] uppercase tracking-widest font-semibold text-zinc-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-[1px] bg-zinc-100" />
                    <span>Income Day</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>Low Spend</span>
                    <div className="w-3 h-3 rounded-[2px] bg-zinc-800/20" />
                    <div className="w-3 h-3 rounded-[2px] bg-rose-950/40" />
                    <div className="w-3 h-3 rounded-[2px] bg-rose-700/60" />
                    <div className="w-3 h-3 rounded-[2px] bg-rose-600/80" />
                    <div className="w-3 h-3 rounded-[2px] bg-rose-500" />
                    <span>High Spend</span>
                </div>
            </div>
        </div>
    );
};

export default ExpenseHeatmap;
