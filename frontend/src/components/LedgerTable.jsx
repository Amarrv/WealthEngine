import React, { useContext, useState, useMemo } from "react";
import { FinanceContext } from "../context/FinanceContext";
import { format, isToday, isYesterday, isThisWeek, isThisMonth, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { 
  MoreVertical, 
  Pencil, 
  Trash2, 
  AlertTriangle, 
  Filter, 
  Search, 
  TrendingDown, 
  TrendingUp, 
  Calendar as CalendarIcon,
  ChevronRight,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QuickAdd from "./QuickAdd";

const LedgerTable = () => {
  const { transactions, metrics, isLoading, deleteTransaction, setDateRange } = useContext(FinanceContext);
  const [editingTx, setEditingTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Local Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const handleDelete = async () => {
    if (!deletingTx) return;
    setIsDeleting(true);
    await deleteTransaction(deletingTx._id);
    setIsDeleting(false);
    setDeletingTx(null);
  };

  // Get unique categories for filter
  const categories = useMemo(() => {
    if (!transactions) return [];
    const cats = new Set(transactions.map(tx => tx.category));
    return Array.from(cats).sort();
  }, [transactions]);

  // Grouping and Filtering Logic
  const groupedData = useMemo(() => {
    if (!transactions) return [];

    // 1. Filter
    const filtered = transactions.filter(tx => {
      const matchesSearch = (tx.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (tx.category || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "ALL" || tx.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    // 2. Group by Date
    const groups = {};
    filtered.forEach(tx => {
      const dateKey = format(new Date(tx.date), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: new Date(tx.date),
          transactions: [],
          summary: {
            totalExpense: 0,
            totalIncome: 0,
            count: 0,
            categories: {}
          }
        };
      }
      
      const group = groups[dateKey];
      group.transactions.push(tx);
      group.summary.count++;
      
      const amt = parseFloat(tx.amount);
      if (tx.type === "INCOME") {
        group.summary.totalIncome += amt;
      } else {
        // Expense or Investment
        group.summary.totalExpense += amt;
        group.summary.categories[tx.category] = (group.summary.categories[tx.category] || 0) + amt;
      }
    });

    // 3. Post-process groups for insights
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(key => {
      const group = groups[key];
      
      // Calculate top category
      let topCat = null;
      let maxAmt = 0;
      Object.entries(group.summary.categories).forEach(([cat, amt]) => {
        if (amt > maxAmt) {
          maxAmt = amt;
          topCat = cat;
        }
      });

      // Insight: % of total daily spend for top category
      let insight = null;
      if (topCat && group.summary.totalExpense > 0) {
        const percentage = Math.round((maxAmt / group.summary.totalExpense) * 100);
        if (percentage > 50) {
          insight = `Significant spend on ${topCat} (${percentage}%)`;
        } else if (group.summary.totalExpense > 10000) {
          insight = `High volume day: ₹${group.summary.totalExpense.toLocaleString()} spent`;
        }
      }

      return {
        ...group,
        dateKey: key,
        summary: {
          ...group.summary,
          topCategory: topCat,
          insight
        }
      };
    });
  }, [transactions, searchQuery, categoryFilter]);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl text-zinc-500">
        No transactions found. Press <kbd className="font-mono bg-white/10 px-1 py-0.5 border border-white/5 rounded text-xs text-zinc-300 shadow-sm">Cmd+K</kbd> to log your first entry.
      </div>
    );
  }

  const getDateLabel = (date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, d MMM");
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* FILTER BAR */}
      <div className="flex flex-col gap-3 bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:w-auto md:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Search descriptions or categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-black/20 border-white/5 focus:border-indigo-500/50 transition-all rounded-xl h-10 text-sm focus-visible:ring-1 focus-visible:ring-indigo-500/20"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-black/20 border-white/5 rounded-xl h-10 text-zinc-300">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Filter className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 shrink-0 bg-black/20 border-white/5 rounded-xl text-zinc-500 hover:text-zinc-200"
              onClick={() => {setSearchQuery(""); setCategoryFilter("ALL");}}
              title="Clear Search & Category"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mr-1 shrink-0">Range:</span>
          {[
            { label: "Today", getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
            { label: "Week", getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfDay(new Date()) }) },
            { label: "Month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
            { label: "Last 30d", getValue: () => ({ from: subDays(new Date(), 30), to: endOfDay(new Date()) }) },
          ].map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-100 rounded-full border border-white/5 transition-all"
              onClick={() => setDateRange(preset.getValue())}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* LEDGER CONTENT */}
      <div className="bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl overflow-hidden min-h-[400px]">
        {/* Header Summary */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-100 font-serif text-lg tracking-wide">Journal Ledger</h3>
            {searchQuery || categoryFilter !== "ALL" ? (
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold animate-pulse">Filtered</span>
            ) : null}
          </div>
          <span className="text-xs text-zinc-500 font-mono">{transactions.length} entries in range</span>
        </div>

        {groupedData.length === 0 ? (
          <div className="p-20 text-center text-zinc-500 flex flex-col items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
               <Search className="w-5 h-5 opacity-20" />
             </div>
             <p className="text-sm">No transactions match your filters.</p>
             <Button variant="ghost" size="sm" onClick={() => {setSearchQuery(""); setCategoryFilter("ALL");}} className="text-indigo-400 hover:bg-indigo-500/10">Clear filters</Button>
          </div>
        ) : (
          <div className="flex flex-col">
            {groupedData.map((group) => (
              <div key={group.dateKey} className="flex flex-col">
                {/* STICKY DATE HEADER */}
                <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur-md px-5 py-3 border-y border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-100 uppercase tracking-tighter">
                        {getDateLabel(group.date)}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {format(group.date, "dd MMM yyyy")} • {group.summary.count} entries
                      </span>
                    </div>
                    {group.summary.insight && (
                      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] text-amber-200 font-medium">{group.summary.insight}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    {group.summary.totalIncome > 0 && (
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest leading-none mb-1">Income</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">+₹{group.summary.totalIncome.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest leading-none mb-1">Total Spend</span>
                      <span className="text-sm font-mono font-bold text-rose-500">-₹{group.summary.totalExpense.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* TRANSACTIONS FOR THIS DATE */}
                <div className="flex flex-col divide-y divide-white/5">
                  {group.transactions.map((tx) => {
                    const isHighValue = parseFloat(tx.amount) >= 5000;
                    const baseColor = tx.type === "INCOME"
                      ? "text-emerald-400"
                      : tx.type === "EXPENSE"
                        ? "text-rose-400"
                        : "text-indigo-400";

                    const bgBadge = tx.type === "INCOME"
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : tx.type === "EXPENSE"
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";

                    const sign = tx.type === "EXPENSE" ? "-" : "+";

                    return (
                      <div 
                        key={tx._id} 
                        className={`group p-4 px-5 flex items-center justify-between hover:bg-white/[0.03] transition-all duration-200 ${isHighValue ? "bg-indigo-500/[0.03]" : ""}`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Indicator Circle */}
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${tx.type === 'INCOME' ? 'bg-emerald-500' : tx.type === 'EXPENSE' ? 'bg-rose-500' : 'bg-indigo-500'} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                          
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium truncate ${isHighValue ? "text-zinc-100 text-base" : "text-zinc-300 text-sm"}`}>
                                {tx.description || "Unspecified"}
                              </span>
                              {isHighValue && <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold tracking-wider uppercase ${bgBadge}`}>
                                {tx.type === "INVESTMENT" ? "Wealth" : tx.type}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-medium">in</span>
                              <span className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase tracking-tighter font-semibold">
                                {tx.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                           <div className="flex flex-col items-end">
                              <div className={`font-mono font-bold tabular-nums whitespace-nowrap transition-all ${isHighValue ? "text-lg md:text-xl" : "text-sm md:text-base"} ${baseColor}`}>
                                {sign}₹{parseFloat(tx.amount).toLocaleString("en-IN", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}
                                <span className="text-[10px] opacity-60 ml-0.5">
                                  {parseFloat(tx.amount) % 1 !== 0 ? `.${(parseFloat(tx.amount) % 1).toFixed(2).split('.')[1]}` : ".00"}
                                </span>
                              </div>
                              {isHighValue && <span className="text-[9px] text-indigo-400/60 uppercase font-bold tracking-widest">High Value</span>}
                           </div>

                           <Popover>
                            <PopoverTrigger asChild>
                              <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-600 hover:text-zinc-300 transition-colors">
                                <MoreVertical size={16} />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-1 bg-zinc-950/90 backdrop-blur-2xl border-white/10 shadow-2xl rounded-xl overflow-hidden" align="end">
                              <button 
                                onClick={() => setEditingTx(tx)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors text-left"
                              >
                                <Pencil size={14} className="text-zinc-500" />
                                Edit Ledger Item
                              </button>
                              <button 
                                onClick={() => setDeletingTx(tx)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400/90 hover:bg-rose-500/10 transition-colors text-left"
                              >
                                <Trash2 size={14} className="text-rose-400/50" />
                                Delete Transaction
                              </button>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
        <DialogContent className="sm:max-w-[500px] bg-zinc-950/95 backdrop-blur-3xl border-white/10 shadow-2xl p-0 overflow-hidden rounded-3xl">
          <div className="p-6">
            <QuickAdd editingTransaction={editingTx} onCancel={() => setEditingTx(null)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deletingTx} onOpenChange={(open) => !open && setDeletingTx(null)}>
        <DialogContent className="sm:max-w-[400px] bg-zinc-900/90 backdrop-blur-2xl border border-white/10 shadow-3xl p-6 text-zinc-100 rounded-3xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
              <AlertTriangle className="text-rose-500 w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-serif">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-zinc-400 leading-relaxed font-sans text-sm">
            Are you sure you want to delete this <span className="text-zinc-100 font-mono">₹{parseFloat(deletingTx?.amount || 0).toLocaleString('en-IN')}</span> transaction? 
            <br /><br />
            This action is permanent and will instantly revert your dashboard metrics.
          </div>
          <DialogFooter className="flex gap-3 pt-4 border-t border-white/5">
            <Button 
               variant="outline" 
               className="flex-1 bg-transparent border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-100 rounded-xl"
               onClick={() => setDeletingTx(null)}
               disabled={isDeleting}
            >
              Wait, Keep it
            </Button>
            <Button 
               className="flex-1 bg-rose-500 text-white hover:bg-rose-600 border-none font-bold rounded-xl"
               onClick={handleDelete}
               disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LedgerTable;
