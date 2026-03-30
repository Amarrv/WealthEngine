import React, { useContext } from "react";
import { Home, LineChart, Target, Scroll, Settings } from "lucide-react";

/**
 * Mobile-only floating taskbar for primary navigation.
 * Uses Glassmorphism styling.
 */
const MobileTaskbar = ({ activeTab, setActiveTab }) => {

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "ledger", label: "Ledger", icon: Scroll },
    { id: "analytics", label: "Analytics", icon: LineChart },
    { id: "goals", label: "Goals", icon: Target },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/50 backdrop-blur-xl border-t border-white/5 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                isActive ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.25} />
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTaskbar;
