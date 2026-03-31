import React, { useContext, useState } from "react";
import { FinanceContext } from "./context/FinanceContext";
import { AuthContext } from "./context/AuthContext";
import Login from "./components/Login";
import { ArrowUpRight, ArrowDownRight, Percent, Landmark, LogOut, Fingerprint, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QuickAdd from "./components/QuickAdd";
import LedgerTable from "./components/LedgerTable";
import ExpenseChart from "./components/ExpenseChart";
import GoalsPage from "./components/GoalsPage";
import RollingChart from "./components/RollingChart";
import ExpenseHeatmap from "./components/ExpenseHeatmap";
import GlobalCommandPalette from "./components/GlobalCommandPalette";
import DateRangePicker from "./components/DateRangePicker";
import MobileTaskbar from "./components/MobileTaskbar";
import FloatingActionButton from "./components/FloatingActionButton";

function App() {
  const { metrics, isLoading: financeLoading, isRefreshing, error } = useContext(FinanceContext);
  const { user, isAuthenticated, isLoading: authLoading, logout, registerPasskey } = useContext(AuthContext);
  const [activeMobileTab, setActiveMobileTab] = useState("home");

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground bg-zinc-950">Securing connection...</div>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (financeLoading)
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground bg-zinc-950">Loading Wealth Engine...</div>;
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-destructive bg-zinc-950">System Error: {error}</div>
    );

  return (
    <div className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950 to-zinc-950 text-zinc-100 font-sans selection:bg-white/10 pb-24 md:pb-8 relative">
      <div className="max-w-[1400px] mx-auto space-y-8 p-4 md:p-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif text-zinc-100 line-clamp-2 md:truncate">
              {user?.username ? `${user.username}'s Dashboard` : 'CFO Dashboard'}
            </h1>
            {isRefreshing && (
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-widest animate-pulse font-semibold">
                <RefreshCcw className="w-3 h-3 animate-spin-slow" />
                <span className="hidden sm:inline">Syncing</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <DateRangePicker />
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={registerPasskey}
                className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md hover:bg-indigo-500/20 transition-all group"
                title="Add Device Passkey"
              >
                <Fingerprint className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md hover:bg-rose-500/20 transition-all"
                title="Disconnect"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* METRICS LAYER (Command Center) - Home Tab */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ${activeMobileTab !== "home" ? "hidden md:grid" : ""}`}>
          <Card className="bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Income
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-zinc-200" strokeWidth={1.25} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-zinc-100 font-mono">
                +₹{metrics.income}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Expenses
              </CardTitle>
              <ArrowDownRight className="h-4 w-4 text-rose-500" strokeWidth={1.25} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-rose-500 font-mono">
                -₹{metrics.expense}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Savings Rate
              </CardTitle>
              <Percent className="h-4 w-4 text-zinc-400" strokeWidth={1.25} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-zinc-300 font-mono">
                {metrics.savingsRate}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Remaining Cash
              </CardTitle>
              <Landmark className="h-4 w-4 text-zinc-200" strokeWidth={1.25} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-zinc-100 font-mono">
                +₹{(parseFloat(metrics.income || 0) - parseFloat(metrics.expense || 0) - parseFloat(metrics.investment || 0)).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* INGESTION & FLOW LAYER - Home Tab */}
        <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ${activeMobileTab !== "home" ? "hidden md:grid" : ""}`}>
          <div className="xl:col-span-1 rounded-2xl overflow-hidden hidden md:block">
            <QuickAdd />
          </div>
          <div className="xl:col-span-2">
            <ExpenseChart />
          </div>
        </div>

        {/* INTELLIGENCE LAYER - Analytics Tab */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4 sm:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-500 ${activeMobileTab !== "analytics" ? "hidden md:grid" : ""}`}>
          <RollingChart />
          <div className="lg:col-span-1">
            <ExpenseHeatmap />
          </div>
        </div>

        {/* LONG TERM & PATTERNS - Goals Tab */}
        <div className={`grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ${activeMobileTab !== "goals" ? "hidden md:grid" : ""}`}>
          <div className="xl:col-span-3">
            <GoalsPage />
          </div>
        </div>

        {/* LEDGER - Ledger Tab */}
        <div className={`rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 ${activeMobileTab !== "ledger" ? "hidden md:block" : ""}`}>
          <LedgerTable />
        </div>

        {/* SETTINGS - Settings Tab (Mobile Only) */}
        <div className={`md:hidden space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 ${activeMobileTab !== "settings" ? "hidden" : "block"}`}>
          <Card className="bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-zinc-100">Security & Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                onClick={registerPasskey}
                className="w-full flex items-center justify-between p-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-5 h-5" />
                  <span className="font-semibold tracking-wide">Add Device Passkey</span>
                </div>
                <ArrowUpRight className="w-4 h-4 opacity-50" />
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center justify-between p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5" />
                  <span className="font-semibold tracking-wide">Disconnect Vault</span>
                </div>
                <ArrowUpRight className="w-4 h-4 opacity-50" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile-First Overlay Elements */}
      <FloatingActionButton />
      <MobileTaskbar activeTab={activeMobileTab} setActiveTab={setActiveMobileTab} />

      <GlobalCommandPalette />
    </div>
  );
}

export default App;
