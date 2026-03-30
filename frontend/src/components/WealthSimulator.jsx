import React, { useState, useContext, useMemo } from "react";
import { FinanceContext } from "../context/FinanceContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar
} from "recharts";

// Box-Muller transform for normal distribution
const randomNormal = (mean, stdDev) => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return (num * stdDev) + mean;
};

const SIMULATIONS = 500;
const INFLATION_RATE = 0.06;

const WealthSimulator = () => {
  const { metrics } = useContext(FinanceContext);

  const currentSurplus = Math.max(0, parseFloat(metrics.income) - parseFloat(metrics.expense)) || 10000;
  const currentInvested = parseFloat(metrics.investment) || 0;

  const [monthlyContribution, setMonthlyContribution] = useState(currentSurplus);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [volatility, setVolatility] = useState(15);
  const [years, setYears] = useState(20);
  const [adjustForInflation, setAdjustForInflation] = useState(false);

  const { projectionData, drawdowns } = useMemo(() => {
    const annualContrib = monthlyContribution * 12;
    const allPaths = [];
    const pathDrawdowns = Array(SIMULATIONS).fill(0).map(() => Array(years + 1).fill(0));

    // Run Monte Carlo Scenarios
    for (let sim = 0; sim < SIMULATIONS; sim++) {
      let wealth = currentInvested;
      const path = [wealth];
      let peak = wealth;

      for (let year = 1; year <= years; year++) {
        // Simple annual random return
        const r = randomNormal(expectedReturn / 100, volatility / 100);

        // Compound: return applied to starting balance, plus new contribution
        wealth = (wealth * (1 + r)) + annualContrib;
        path.push(wealth);

        // Track drawdowns
        if (wealth > peak) peak = wealth;
        const drawdown = peak > 0 ? ((peak - wealth) / peak) * 100 : 0;
        pathDrawdowns[sim][year] = drawdown;
      }
      allPaths.push(path);
    }

    // Aggregate Percentiles
    const data = [];
    const ddData = [];

    const getPercentile = (arr, p) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const index = Math.floor((p / 100) * sorted.length);
      return sorted[index];
    };

    let totalInvested = currentInvested;
    for (let year = 0; year <= years; year++) {
      if (year > 0) totalInvested += annualContrib;

      const yearValues = allPaths.map(p => Math.max(0, p[year]));
      const yearDDs = pathDrawdowns.map(dd => dd[year]);

      // Calculate Inflation discount factor
      const discount = adjustForInflation ? Math.pow(1 + INFLATION_RATE, year) : 1;

      data.push({
        year: `Y${year}`,
        Invested: Math.round(totalInvested / discount),
        WorstCase: Math.round(getPercentile(yearValues, 10) / discount),
        Expected: Math.round(getPercentile(yearValues, 50) / discount),
        BestCase: Math.round(getPercentile(yearValues, 90) / discount),
      });

      ddData.push({
        year: `Y${year}`,
        ExpectedDD: Math.round(getPercentile(yearDDs, 50)),
        WorstDD: Math.round(getPercentile(yearDDs, 90))
      });
    }

    return { projectionData: data, drawdowns: ddData };
  }, [monthlyContribution, expectedReturn, volatility, years, currentInvested, adjustForInflation]);

  const finalYear = projectionData[projectionData.length - 1];
  const expectedValue = finalYear.Expected;

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-zinc-100">Monte Carlo Engine</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-muted-foreground font-medium">Real (Inflation Adjusted)</label>
          <input
            type="checkbox"
            checked={adjustForInflation}
            onChange={(e) => setAdjustForInflation(e.target.checked)}
            className="w-4 h-4 accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="space-y-3">
          <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block">Monthly Inv (₹)</label>
          <input 
            type="number" 
            value={monthlyContribution} 
            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            className="w-full bg-zinc-800/50 border border-white/5 rounded-lg px-3 py-2 text-zinc-100 font-mono text-sm focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <input type="range" min="0" max="500000" step="5000" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))} className="w-full accent-zinc-300 h-1.5" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block">Exp. Return (%)</label>
          <input 
            type="number" 
            value={expectedReturn} 
            onChange={(e) => setExpectedReturn(Number(e.target.value))}
            className="w-full bg-zinc-800/50 border border-white/5 rounded-lg px-3 py-2 text-zinc-100 font-mono text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          <input type="range" min="4" max="25" step="0.5" value={expectedReturn} onChange={(e) => setExpectedReturn(Number(e.target.value))} className="w-full accent-indigo-500/50 h-1.5" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block">Volatility σ (%)</label>
          <input 
            type="number" 
            value={volatility} 
            onChange={(e) => setVolatility(Number(e.target.value))}
            className="w-full bg-zinc-800/50 border border-white/5 rounded-lg px-3 py-2 text-zinc-100 font-mono text-sm focus:outline-none focus:border-rose-500/30 transition-colors"
          />
          <input type="range" min="0" max="40" step="1" value={volatility} onChange={(e) => setVolatility(Number(e.target.value))} className="w-full accent-rose-500/30 h-1.5" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block">Horizon (Years)</label>
          <input 
            type="number" 
            value={years} 
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full bg-zinc-800/50 border border-white/5 rounded-lg px-3 py-2 text-zinc-100 font-mono text-sm focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <input type="range" min="5" max="50" step="1" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full accent-zinc-600 h-1.5" />
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-zinc-400 uppercase tracking-wider font-semibold">Median Expected Wealth</p>
        <p className="text-4xl font-bold text-zinc-100 font-mono">
          +₹{expectedValue.toLocaleString("en-IN")} {adjustForInflation && <span className="text-[10px] text-zinc-500 align-top ml-1">Today's Value</span>}
        </p>
      </div>

      <div className="h-[400px] w-full mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f4f4f5" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f4f4f5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorWorst" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="year" tick={{ fill: "#a1a1aa", fontSize: 12, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} tick={{ fill: "#a1a1aa", fontSize: 12, fontFamily: "Inter" }} axisLine={false} tickLine={false} width={80} />
            <Tooltip
              formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
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
            <Legend verticalAlign="top" height={36} wrapperStyle={{ color: "#a1a1aa", fontFamily: "Inter", fontSize: "12px" }} />
            <Area type="monotone" dataKey="BestCase" stroke="#f4f4f5" strokeWidth={1} fill="url(#colorBest)" name="90th Percentile" />
            <Area type="monotone" dataKey="Expected" stroke="#6366f1" strokeWidth={3} fill="url(#colorExpected)" name="Median (50th)" />
            <Area type="monotone" dataKey="WorstCase" stroke="#e11d48" strokeWidth={1} fill="url(#colorWorst)" name="10th Percentile" />
            <Area type="monotone" dataKey="Invested" stroke="#52525b" strokeWidth={2} fill="none" strokeDasharray="5 5" name="Capital Invested" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest ml-1">Expected Maximum Drawdowns (Market Crashes)</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={drawdowns} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="year" hide />
              <YAxis reversed width={80} tickFormatter={(val) => `${val}%`} tick={{ fill: "#e11d48", fontSize: 12, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val) => `-${val}%`}
                contentStyle={{
                  backgroundColor: "rgba(24, 24, 27, 0.4)",
                  backdropFilter: "blur(24px)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  color: "#f4f4f5",
                  borderRadius: "12px",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)"
                }}
                itemStyle={{ color: "#f4f4f5", fontFamily: "JetBrains Mono" }}
              />
              <Bar dataKey="ExpectedDD" fill="#6366f1" opacity={0.3} name="Median Drawdown" radius={[0, 0, 4, 4]} />
              <Bar dataKey="WorstDD" fill="#e11d48" opacity={0.6} name="90th Percentile Drawdown" radius={[0, 0, 4, 4]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default WealthSimulator;
