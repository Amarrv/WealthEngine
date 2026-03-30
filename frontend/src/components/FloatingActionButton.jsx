import React from "react";
import { Plus } from "lucide-react";

/**
 * Mobile-only Floating Action Button (FAB).
 * Triggers the document-level Cmd+K global event.
 */
const FloatingActionButton = () => {
  const triggerCommandPalette = () => {
    // We dispatch a keyboard event matching the Cmd+K shortcut
    // This allows seamless integration with the existing GlobalCommandPalette listener
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <div className="md:hidden fixed bottom-20 right-6 z-50">
      <button
        onClick={triggerCommandPalette}
        className="flex items-center justify-center w-14 h-14 bg-zinc-100 text-zinc-950 rounded-full shadow-[0_4px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all duration-300"
        aria-label="Add Transaction"
      >
        <Plus className="w-6 h-6" strokeWidth={2} />
      </button>
    </div>
  );
};

export default FloatingActionButton;
