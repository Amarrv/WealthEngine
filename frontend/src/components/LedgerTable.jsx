import React, { useContext, useState } from "react";
import { FinanceContext } from "../context/FinanceContext";
import { format } from "date-fns";
import { MoreVertical, Pencil, Trash2, AlertTriangle, X } from "lucide-react";
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
import QuickAdd from "./QuickAdd";

const LedgerTable = () => {
  const { transactions, metrics, isLoading, deleteTransaction } = useContext(FinanceContext);
  const [editingTx, setEditingTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingTx) return;
    setIsDeleting(true);
    await deleteTransaction(deletingTx._id);
    setIsDeleting(false);
    setDeletingTx(null);
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl text-zinc-500">
        No transactions found. Press <kbd className="font-mono bg-white/10 px-1 py-0.5 border border-white/5 rounded text-xs text-zinc-300 shadow-sm">Cmd+K</kbd> to log your first entry.
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl md:rounded-b-none overflow-hidden">
      
      {/* Mobile-Only Summary Ribbon */}
      <div className="md:hidden flex flex-row justify-between gap-2 p-4 pb-0 mb-2">
        {/* Income Card */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-lg p-2 flex-1 text-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">In</div>
          {isLoading ? (
            <div className="h-4 w-16 bg-white/5 rounded mx-auto animate-pulse"></div>
          ) : (
            <div className="text-xs font-mono text-zinc-200">
              ₹{parseFloat(metrics.income || 0).toLocaleString('en-IN')}
            </div>
          )}
        </div>
        
        {/* Expense Card */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-lg p-2 flex-1 text-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Out</div>
          {isLoading ? (
            <div className="h-4 w-16 bg-white/5 rounded mx-auto animate-pulse"></div>
          ) : (
            <div className="text-xs font-mono text-rose-400 border-white/5">
              ₹{parseFloat(metrics.expense || 0).toLocaleString('en-IN')}
            </div>
          )}
        </div>
        
        {/* Invested Card */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-lg p-2 flex-1 text-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Invested</div>
          {isLoading ? (
            <div className="h-4 w-16 bg-white/5 rounded mx-auto animate-pulse"></div>
          ) : (
            <div className="text-xs font-mono text-indigo-400 border-white/5">
              ₹{parseFloat(metrics.investment || 0).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 px-5 border-b border-white/5 pb-3 mb-2 md:mb-0 md:bg-white/5">
        <h3 className="font-semibold text-zinc-100 font-serif text-lg tracking-wide">Transaction Ledger</h3>
        <span className="text-xs text-zinc-500 font-mono">{transactions.length} entries</span>
      </div>

      {/* Desktop View: Dense Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left font-mono">
          <thead className="text-xs uppercase bg-black/20 text-zinc-500 border-b border-white/10">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Date</th>
              <th scope="col" className="px-3 py-2 font-medium">Description</th>
              <th scope="col" className="px-3 py-2 font-medium">Category</th>
              <th scope="col" className="px-3 py-2 font-medium">Type</th>
              <th scope="col" className="px-3 py-2 font-medium text-right">Amount</th>
              <th scope="col" className="px-3 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {transactions.map((tx) => {
              const baseColor = tx.type === "INCOME"
                ? "text-zinc-100"
                : tx.type === "EXPENSE"
                  ? "text-rose-500"
                  : "text-indigo-500";

              const bgBadge = tx.type === "INCOME"
                ? "bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold"
                : tx.type === "EXPENSE"
                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                  : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";

              const sign = tx.type === "EXPENSE" ? "-" : "+";

              return (
                <tr
                  key={tx._id}
                  className="hover:bg-white/5 transition-colors duration-150 group"
                >
                  <td className="px-3 py-2 text-zinc-500 whitespace-nowrap">
                    {format(new Date(tx.date), "dd MMM yyyy")}
                  </td>
                  <td className="px-3 py-2 font-medium text-zinc-300 truncate max-w-[200px]">
                    {tx.description || "-"}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">
                    {tx.category}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase ${bgBadge}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-3 py-2 text-right font-bold whitespace-nowrap tabular-nums ${baseColor}`}>
                    {sign}₹{parseFloat(tx.amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="p-1.5 hover:bg-white/10 rounded-md text-zinc-600 hover:text-zinc-300 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-1 bg-zinc-900/90 backdrop-blur-xl border-white/10 shadow-2xl rounded-xl overflow-hidden" align="end">
                        <button 
                          onClick={() => setEditingTx(tx)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5 transition-colors text-left"
                        >
                          <Pencil size={14} />
                          Edit Transaction
                        </button>
                        <button 
                          onClick={() => setDeletingTx(tx)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400/90 hover:bg-rose-500/10 transition-colors text-left"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </PopoverContent>
                    </Popover>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Stacked List Tiles */}
      <div className="md:hidden flex flex-col divide-y divide-white/10 text-zinc-300">
        {transactions.map((tx) => {
          const baseColor = tx.type === "INCOME"
            ? "text-zinc-100"
            : tx.type === "EXPENSE"
              ? "text-rose-500"
              : "text-indigo-500";

          const bgBadge = tx.type === "INCOME"
            ? "bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold"
            : tx.type === "EXPENSE"
              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
              : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";

          const sign = tx.type === "EXPENSE" ? "-" : "+";

          return (
            <div key={tx._id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
              <div className="flex flex-col space-y-1 overflow-hidden pr-4 flex-1">
                <span className="font-medium text-zinc-200 truncate">{tx.description || "Unspecified"}</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase ${bgBadge}`}>
                    {tx.type}
                  </span>
                  <span className="text-[10px] text-zinc-400 bg-zinc-800/40 px-1.5 py-0.5 rounded border border-white/5 uppercase tracking-tighter">
                    {tx.category}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">{format(new Date(tx.date), "dd MMM")}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`text-right font-bold font-mono whitespace-nowrap tabular-nums ${baseColor}`}>
                  {sign}₹{parseFloat(tx.amount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1 bg-zinc-900/90 backdrop-blur-xl border-white/10 shadow-2xl rounded-xl overflow-hidden" align="end">
                    <button 
                      onClick={() => setEditingTx(tx)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5 transition-colors text-left"
                    >
                      <Pencil size={14} />
                      Edit Transaction
                    </button>
                    <button 
                      onClick={() => setDeletingTx(tx)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400/90 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT MODAL */}
      <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
        <DialogContent className="sm:max-w-[500px] bg-zinc-950/95 backdrop-blur-3xl border-white/10 shadow-2xl p-0 overflow-hidden">
          <div className="p-6">
            <QuickAdd editingTransaction={editingTx} onCancel={() => setEditingTx(null)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deletingTx} onOpenChange={(open) => !open && setDeletingTx(null)}>
        <DialogContent className="sm:max-w-[400px] bg-zinc-900/90 backdrop-blur-2xl border border-white/10 shadow-3xl p-6 text-zinc-100 rounded-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
              <AlertTriangle className="text-rose-500 w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-serif">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-zinc-400 leading-relaxed font-sans text-sm">
            Are you sure you want to delete this <span className="text-zinc-100 font-mono">₹{parseFloat(deletingTx?.amount || 0).toLocaleString('en-IN')}</span> transaction? 
            <br /><br />
            This action is permanent and will instantly recalculate your <span className="italic font-serif">Obsidian Wealth</span> dashboard.
          </div>
          <DialogFooter className="flex gap-3 sm:justify-start">
            <Button 
               variant="outline" 
               className="bg-transparent border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
               onClick={() => setDeletingTx(null)}
               disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
               className="bg-rose-500 text-white hover:bg-rose-600 border-none font-bold"
               onClick={handleDelete}
               disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LedgerTable;
