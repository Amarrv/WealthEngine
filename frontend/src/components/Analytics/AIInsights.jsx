import React from "react";
import { 
    AlertTriangle, 
    TrendingUp, 
    Trophy, 
    ArrowRight, 
    ShieldCheck, 
    Flame,
    Navigation2
} from "lucide-react";

/**
 * AI Insights Mode: Health Score + Actionable Cards
 */
const AIInsights = ({ health, insights }) => {
    return (
        <div className="space-y-6">
            {/* Health Score Card */}
            <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                
                <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                    <div className="relative flex items-center justify-center">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-white/5"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={364}
                                strokeDashoffset={364 - (364 * health.score) / 100}
                                className={`${health.score > 70 ? 'text-emerald-400' : health.score > 40 ? 'text-amber-400' : 'text-rose-400'} transition-all duration-1000 ease-out`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute text-3xl font-mono font-bold text-zinc-100">
                            {health.score}
                        </span>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-zinc-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Financial Health Score</span>
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-zinc-100 mb-2">{health.explanation}</h2>
                        <p className="text-zinc-400 text-sm mb-4 leading-relaxed max-w-lg">{health.reason}</p>
                        
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                            <Navigation2 className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                            <span className="text-xs font-semibold text-zinc-300">Fixing it: </span>
                            <span className="text-xs text-zinc-100">{health.fix}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insights Priority List */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 ml-2">Prioritized Recommendations ({insights.length})</h3>
                
                {insights.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
                        <Trophy className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 font-serif italic text-sm">You are operating at peak efficiency. No immediate leaks detected.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {insights.map((insight) => (
                            <InsightCard key={insight.id} insight={insight} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const InsightCard = ({ insight }) => {
    const isHigh = insight.priority === "HIGH";
    
    return (
        <div className={`group bg-zinc-900/40 backdrop-blur-xl border ${isHigh ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10'} rounded-3xl p-6 transition-all duration-300 hover:bg-zinc-900/60`}>
            <div className="flex items-start gap-5">
                <div className={`p-3 rounded-2xl ${isHigh ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800 text-zinc-400'}`}>
                    {insight.type === "LEAK" ? <Flame className="w-5 h-5" /> : 
                     insight.type === "GOAL" ? <AlertTriangle className="w-5 h-5" /> : 
                     <TrendingUp className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isHigh ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                            {insight.priority} Priority
                        </span>
                    </div>
                    <h4 className="text-lg font-bold text-zinc-100 mb-3">{insight.title}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Problem</span>
                            <p className="text-sm text-zinc-300 leading-relaxed font-medium">{insight.problem}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Suggested Action</span>
                            <div className="flex items-start gap-2">
                                <ArrowRight className="w-3 h-3 text-indigo-400 mt-1 shrink-0" />
                                <p className="text-sm text-zinc-100 leading-relaxed font-bold italic">{insight.action}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Potential Impact</span>
                            <p className="text-sm text-emerald-400/90 leading-relaxed font-mono font-bold">{insight.impact}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(AIInsights);
