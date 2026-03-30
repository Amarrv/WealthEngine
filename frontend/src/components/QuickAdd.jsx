import React, { useState, useContext, useRef } from "react";
import { FinanceContext } from "../context/FinanceContext";

const QuickAdd = ({ editingTransaction = null, onCancel = null }) => {
  const { addTransaction, updateTransaction } = useContext(FinanceContext);

  // Local state for the frictionless form
  const [amount, setAmount] = useState(editingTransaction?.amount || "");
  const [type, setType] = useState(editingTransaction?.type || "EXPENSE");
  const [category, setCategory] = useState(editingTransaction?.category || "Food");
  const [description, setDescription] = useState(editingTransaction?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reference to snap focus back to the input after submission
  const amountInputRef = useRef(null);

  // Dynamic category mapping based on transaction type
  const categories = {
    EXPENSE: [
      "Food",
      "Transport",
      "Rent",
      "Utilities",
      "Entertainment",
      "Shopping",
      "Misc",
    ],
    INCOME: ["Salary", "Freelance", "Dividends", "Interest", "Other"],
    INVESTMENT: ["Index Fund", "Debt Fund", "Gold", "Crypto", "Emergency Fund"],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 1. Client-Side Validation (Fail fast before hitting the network)
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Amount must be a valid positive number.");
      return;
    }

    setIsSubmitting(true);

    // 2. Construct Payload (matching our Zod schema exactly)
    const payload = {
      amount: parseFloat(amount).toFixed(2), // Coerce to strict string format
      type,
      category,
      description,
    };

    // 3. Execute Context Mutation
    const result = editingTransaction 
      ? await updateTransaction(editingTransaction._id, payload)
      : await addTransaction(payload);

    setIsSubmitting(false);

    if (result.success) {
      if (editingTransaction && onCancel) {
        onCancel();
      } else {
        // 4. The Dopamine Loop: Instantly clear the form and snap focus back
        setAmount("");
        setDescription("");
        amountInputRef.current?.focus();
      }
    } else {
      setError(result.message);
    }
  };

  // When the user changes the Type (e.g., Expense to Income),
  // we auto-select the first available category in that new list.
  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(categories[newType][0]);
  };

  return (
    <div className={`${editingTransaction ? '' : 'bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl p-6 mb-8'}`}>
      <h3 className="mt-0 mb-4 text-zinc-100 font-serif text-xl tracking-wide font-semibold">
        {editingTransaction ? "Edit Transaction" : "Log Transaction"}
      </h3>

      <form
        onSubmit={handleSubmit}
        className="flex gap-4 items-start flex-wrap"
      >
        {/* AMOUNT INPUT (The primary action) */}
        <div className="flex-1 min-w-[150px]">
          <input
            ref={amountInputRef}
            type="number"
            step="0.01"
            placeholder="₹ Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSubmitting}
            className="w-full p-3 text-lg bg-transparent border-b border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-300 transition-colors duration-300 font-mono"
            autoFocus
          />
        </div>

        {/* TYPE SELECTOR */}
        <div className="flex-1 min-w-[150px]">
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            disabled={isSubmitting}
            className="w-full p-3.5 text-base bg-transparent border-b border-zinc-700 text-zinc-100 focus:outline-none focus:border-zinc-300 transition-colors duration-300 appearance-none [&>option]:bg-zinc-900"
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="INVESTMENT">Investment</option>
          </select>
        </div>

        {/* CATEGORY SELECTOR */}
        <div className="flex-1 min-w-[150px]">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
            className="w-full p-3.5 text-base bg-transparent border-b border-zinc-700 text-zinc-100 focus:outline-none focus:border-zinc-300 transition-colors duration-300 appearance-none [&>option]:bg-zinc-900"
          >
            {categories[type].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* DESCRIPTION INPUT (Optional) */}
        <div className="w-full">
           <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            className="w-full p-3 text-base bg-transparent border-b border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-300 transition-colors duration-300 font-serif italic"
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          {editingTransaction && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-8 py-3.5 text-base font-bold text-zinc-400 border border-white/10 hover:bg-white/5 rounded transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-8 py-3.5 text-base font-bold text-zinc-950 bg-zinc-100 hover:bg-white rounded transition-colors min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : (editingTransaction ? "Save Changes" : "Add")}
          </button>
        </div>
      </form>

      {error && (
        <p className="text-destructive mt-4 text-sm">
          {error}
        </p>
      )}
    </div>
  );
};

export default QuickAdd;
