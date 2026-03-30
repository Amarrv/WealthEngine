import React, { useState, useContext } from "react";
import { FinanceContext } from "../context/FinanceContext";
import { Plus, Target, Briefcase, Plane, Laptop, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";

const iconMap = {
  Target: Target,
  Briefcase: Briefcase,
  Plane: Plane,
  Laptop: Laptop,
  ShieldCheck: ShieldCheck,
};

const GoalCard = ({ goal }) => {
  const { addGoalFunds, deleteGoal } = useContext(FinanceContext);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetAmount = parseFloat(goal.targetAmount);
  const currentSaved = parseFloat(goal.currentSaved);
  const percentage = Math.min(Math.round((currentSaved / targetAmount) * 100), 100) || 0;

  const IconComponent = iconMap[goal.icon] || Target;

  const handleAddFunds = async (e) => {
    e.preventDefault();
    if (!addAmount || isNaN(addAmount) || parseFloat(addAmount) <= 0) return;
    
    setIsSubmitting(true);
    await addGoalFunds(goal._id, addAmount);
    setIsSubmitting(false);
    setShowAddFunds(false);
    setAddAmount("");
  };

  const monthsRemaining = () => {
    const targetDate = new Date(goal.targetDate);
    const now = new Date();
    const diffTime = targetDate - now;
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    return diffMonths > 0 ? `${diffMonths} months remaining` : "Target reached / Due";
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4 group hover:border-white/20 transition-all shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-zinc-100/5 rounded-xl border border-white/5 text-zinc-100">
            <IconComponent size={20} strokeWidth={1.25} />
          </div>
          <h4 className="font-semibold text-zinc-100 text-base tracking-tight">{goal.name}</h4>
        </div>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
           <button 
            onClick={() => setShowAddFunds(true)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <Plus size={16} />
          </button>
           <button 
            onClick={() => deleteGoal(goal._id)}
            className="p-1.5 hover:bg-rose-500/10 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Progress</span>
            <div className="text-sm font-mono text-zinc-100">
              ₹{currentSaved.toLocaleString('en-IN')} <span className="text-zinc-500 text-[10px]">/ ₹{targetAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <span className="text-xs font-mono text-zinc-300 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{percentage}%</span>
        </div>
        
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-zinc-500 to-zinc-100 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(255,255,255,0.1)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-zinc-500 font-mono italic">
          {monthsRemaining()}
        </span>
        <span className="text-[10px] text-zinc-400">
          Target: {new Date(goal.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
        </span>
      </div>

      <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
        <DialogContent className="bg-zinc-900/95 border-white/10 text-zinc-100 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-serif">Add Funds to {goal.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddFunds} className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Amount to Add (₹)</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                autoFocus
                className="bg-zinc-800/50 border-white/5 text-lg font-mono py-6"
              />
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-zinc-100 text-zinc-950 font-bold hover:bg-white"
              >
                {isSubmitting ? "Updating..." : "Confirm Contribution"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoalCard;
