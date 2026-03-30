import React, { useState, useContext } from "react";
import { FinanceContext } from "../context/FinanceContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import WealthSimulator from "./WealthSimulator";
import GoalCard from "./GoalCard";
import { Plus, Target, Plane, Briefcase, Laptop, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";

const GoalsPage = () => {
  const { goals, addGoal } = useContext(FinanceContext);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
    icon: "Target",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount || !formData.targetDate) return;
    
    setIsSubmitting(true);
    await addGoal(formData);
    setIsSubmitting(false);
    setShowNewGoal(false);
    setFormData({ name: "", targetAmount: "", targetDate: "", icon: "Target" });
  };

  return (
    <div className="space-y-8 pb-10">
      <Tabs defaultValue="targets" className="w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <TabsList>
            <TabsTrigger value="targets" className="gap-2">
              <Target size={14} strokeWidth={1.5} />
              Active Targets
            </TabsTrigger>
            <TabsTrigger value="simulator" className="gap-2">
              <ShieldCheck size={14} strokeWidth={1.5} />
              Wealth Simulator
            </TabsTrigger>
          </TabsList>

          <Button 
            onClick={() => setShowNewGoal(true)}
            className="w-full sm:w-auto bg-zinc-100 text-zinc-950 font-bold hover:bg-white px-6 py-6 sm:py-0 h-11 rounded-xl shadow-lg transition-all active:scale-95"
          >
            <Plus size={18} className="mr-2" strokeWidth={3} />
            New Goal
          </Button>
        </div>

        <TabsContent value="targets" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-zinc-900/40 border border-white/10 rounded-3xl border-dashed">
              <div className="p-4 bg-zinc-800/50 rounded-full mb-4 border border-white/5">
                <Target size={32} className="text-zinc-500" />
              </div>
              <h3 className="text-zinc-200 font-serif text-xl">No active targets set</h3>
              <p className="text-zinc-500 text-sm mt-1">Initialize a sinking fund to start tracking wealth allocation.</p>
              <Button 
                onClick={() => setShowNewGoal(true)}
                variant="outline" 
                className="mt-6 border-white/10 text-zinc-300 hover:bg-white/5"
              >
                Create your first goal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => (
                <GoalCard key={goal._id} goal={goal} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="simulator" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <WealthSimulator />
        </TabsContent>
      </Tabs>

      {/* NEW GOAL MODAL */}
      <Dialog open={showNewGoal} onOpenChange={setShowNewGoal}>
        <DialogContent className="bg-zinc-950/95 backdrop-blur-3xl border-white/10 text-zinc-100 sm:max-w-[450px] p-0 overflow-hidden rounded-3xl shadow-3xl">
          <div className="p-8 space-y-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif text-zinc-100 italic">Configure Target</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest ml-1">Objective Name</label>
                <Input 
                  placeholder="e.g., MacBook Pro 16" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-zinc-900/50 border-white/5 py-6 text-zinc-100 placeholder:text-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest ml-1">Target Amount</label>
                  <Input 
                    type="number"
                    placeholder="₹ 0.00" 
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                    className="bg-zinc-900/50 border-white/5 py-6 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest ml-1">Deadline</label>
                  <Input 
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                    className="bg-zinc-900/50 border-white/5 py-6 text-zinc-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest ml-1">Identity Icon</label>
                <div className="flex gap-3">
                  {[
                    { id: 'Target', icon: Target },
                    { id: 'Briefcase', icon: Briefcase },
                    { id: 'Plane', icon: Plane },
                    { id: 'Laptop', icon: Laptop },
                    { id: 'ShieldCheck', icon: ShieldCheck },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({...formData, icon: item.id})}
                      className={`p-3 rounded-xl border transition-all ${formData.icon === item.id ? 'bg-zinc-100 text-zinc-950 border-white' : 'bg-white/5 text-zinc-500 border-white/5 hover:border-white/20'}`}
                    >
                      <item.icon size={20} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-zinc-100 text-zinc-950 font-bold hover:bg-white h-14 rounded-2xl text-lg shadow-xl"
                >
                  {isSubmitting ? "Creating..." : "Initialize Target"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoalsPage;
