import React, { useContext } from "react";
import { FinanceContext } from "../context/FinanceContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const ExpenseChart = () => {
  const { metrics } = useContext(FinanceContext);

  const data = metrics.expenseBreakdown || [];

  if (data.length === 0) {
    return (
      <div className="bg-zinc-900/40 h-[300px] flex items-center justify-center bg-card rounded-lg border shadow-sm text-center p-4">
        <p className="text-muted-foreground italic font-serif">No outflows (expenses or investments) logged for this period.</p>
      </div>
    );
  }

  // A high-contrast semantic palette for the Spatial Noir redesign
  const COLORS = [
    "#f43f5e", // Rose 500 (Expense)
    "#6366f1", // Indigo 500 (Investments)
    "#f4f4f5", // Zinc 100 (Platinum highlight)
    "#e11d48", // Rose 600 (Major Outflow)
    "#a1a1aa", // Zinc 400 (Misc/Neutral)
    "#fb7185", // Rose 400 (Variable)
    "#71717a", // Zinc 500 (Muted)
  ];

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl p-6">
      <h3 className="text-xl font-serif tracking-wide font-semibold text-zinc-100 mb-4">
        Outflow Breakdown
      </h3>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              stroke="#09090b"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `₹${value.toLocaleString("en-IN")}`}
              contentStyle={{
                backgroundColor: "rgba(24, 24, 27, 0.4)", // zinc-900/40
                backdropFilter: "blur(24px)",
                borderColor: "rgba(255, 255, 255, 0.1)",
                color: "#f4f4f5",
                borderRadius: "12px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)"
              }}
              itemStyle={{ color: "#f4f4f5", fontFamily: "JetBrains Mono" }}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: "#a1a1aa", fontFamily: "Inter", fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(ExpenseChart);
