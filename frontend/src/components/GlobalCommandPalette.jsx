import React, { useState, useEffect, useContext, useMemo } from "react";
import { FinanceContext } from "../context/FinanceContext";
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
} from "./ui/command";
import { Plus, TrendingUp, TrendingDown, RefreshCcw } from "lucide-react";

/* =========================
   🔹 DICTIONARY (IMPROVED)
========================= */

// TRAVEL
const EXPENSE_TRAVEL = [
    'bus', 'mtc', 'auto', 'rapido', 'uber', 'ola', 'metro', 'train', 'irctc',
    'flight', 'petrol', 'fuel', 'diesel', 'fastag', 'cab', 'redbus',
    'bike taxi', 'parking', 'toll'
];

// FOOD
const EXPENSE_FOOD = [
    'swiggy', 'zomato', 'zepto', 'blinkit', 'instamart',
    'grocery', 'supermarket', 'dmart', 'spencer', 'reliance',
    'hotel', 'restaurant', 'cafe', 'bakery',
    'tea', 'chai', 'coffee',
    'breakfast', 'lunch', 'dinner', 'snacks',
    'juice', 'milk', 'aavin', 'water',
    'food court', 'mess', 'canteen'
];

// UTILITIES
const EXPENSE_UTILITIES = [
    'electricity', 'tneb', 'eb bill',
    'wifi', 'broadband', 'act', 'hathway',
    'jio', 'airtel', 'vi', 'bsnl',
    'recharge', 'mobile bill',
    'gas', 'cylinder', 'lpg',
    'water bill', 'maintenance'
];

/* =========================
   🔥 ADVANCED CATEGORY ENGINE
========================= */

const CATEGORY_MAP = [
    // EXPENSES
    { keywords: EXPENSE_FOOD, type: "EXPENSE", category: "Food" },
    { keywords: EXPENSE_TRAVEL, type: "EXPENSE", category: "Transport" },
    { keywords: EXPENSE_UTILITIES, type: "EXPENSE", category: "Utilities" },

    // INVESTMENTS
    { keywords: ['stock', 'shares', 'zerodha', 'kite'], type: "INVESTMENT", category: "Equities" },
    { keywords: ['mutual fund', 'sip', 'groww', 'coin'], type: "INVESTMENT", category: "Mutual Funds" },
    { keywords: ['fd', 'fixed deposit', 'rd'], type: "INVESTMENT", category: "Fixed Income" },
    { keywords: ['ppf', 'epf', 'nps'], type: "INVESTMENT", category: "Retirement" },
    { keywords: ['gold', 'sgb'], type: "INVESTMENT", category: "Gold" },
    { keywords: ['crypto', 'bitcoin', 'ethereum'], type: "INVESTMENT", category: "Crypto" },

    // INCOME
    { keywords: ['salary', 'bonus', 'incentive'], type: "INCOME", category: "Salary" },
    { keywords: ['freelance', 'consulting'], type: "INCOME", category: "Business" },
    { keywords: ['dividend'], type: "INCOME", category: "Investment Income" },
    { keywords: ['interest'], type: "INCOME", category: "Interest Income" },
    { keywords: ['rent received'], type: "INCOME", category: "Rental Income" },
    { keywords: ['cashback', 'refund'], type: "INCOME", category: "Other Income" },
];

/* =========================
   🔍 HELPERS
========================= */

// Normalize input
const normalizeText = (text) => {
    return text
        .toLowerCase()
        .replace(/[₹]/g, '')
        .replace(/rs\.?/gi, '')
        .replace(/[0-9]/g, '')
        .replace(/[^a-zA-Z\s]/g, '')
        .trim();
};

// Advanced detection
const detectCategoryAdvanced = (desc, transactions) => {
    if (!desc) return { type: "EXPENSE", category: "Misc" };

    // 1. Rule-based match
    for (let rule of CATEGORY_MAP) {
        if (rule.keywords.some(k => desc.includes(k))) {
            return { type: rule.type, category: rule.category };
        }
    }

    // 2. Learn from history
    const pastTx = [...transactions]
        .reverse()
        .find(t => t.description.toLowerCase() === desc);

    if (pastTx) {
        return { type: pastTx.type, category: pastTx.category };
    }

    // 3. Default fallback
    return { type: "EXPENSE", category: "Misc" };
};

/* =========================
   🚀 COMPONENT
========================= */

const GlobalCommandPalette = () => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [manualType, setManualType] = useState(null);

    const { addTransaction, transactions } = useContext(FinanceContext);

    // Cmd + K
    useEffect(() => {
        const down = (e) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(o => !o);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Reset override
    useEffect(() => {
        if (!open || !inputValue) setManualType(null);
    }, [open, inputValue]);

    /* =========================
       🔥 PARSER ENGINE
    ========================= */

    const parsedData = useMemo(() => {
        if (!inputValue) {
            return { amount: null, normalizedDesc: "", type: "EXPENSE", category: "Misc" };
        }

        // Extract amount
        const amountRegex = /(?:₹|Rs\.?\s*)?(\d+(\.\d{1,2})?)/i;
        const match = inputValue.match(amountRegex);
        const amount = match ? match[1] : null;

        let desc = inputValue;
        if (match) desc = desc.replace(match[0], '');

        const normalizedDesc = normalizeText(desc);

        // Detect category
        const detected = detectCategoryAdvanced(normalizedDesc, transactions);

        const finalType = manualType || detected.type;

        return {
            amount,
            normalizedDesc,
            type: finalType,
            category: detected.category
        };
    }, [inputValue, transactions, manualType]);

    /* =========================
       🔁 TYPE SWITCH
    ========================= */

    const cycleType = () => {
        setManualType(prev => {
            const current = prev || parsedData.type;
            if (current === "EXPENSE") return "INCOME";
            if (current === "INCOME") return "INVESTMENT";
            return "EXPENSE";
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            cycleType();
        }
    };

    /* =========================
       ✅ CREATE TRANSACTION
    ========================= */

    const handleCreate = async () => {
        const { amount, normalizedDesc, type, category } = parsedData;

        if (!amount || !normalizedDesc) return;

        const formattedDesc =
            normalizedDesc.charAt(0).toUpperCase() + normalizedDesc.slice(1);

        const res = await addTransaction({
            amount,
            description: formattedDesc,
            type,
            category,
            date: new Date().toISOString()
        });

        if (res.success) {
            setInputValue("");
            setOpen(false);
            setManualType(null);
        } else {
            alert(res.message);
        }
    };

    /* =========================
       🎨 UI
    ========================= */
    return (
        <>
            <p className="fixed bottom-4 right-4 text-sm text-zinc-400 bg-zinc-900/40 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2">
                <kbd className="font-mono text-xs bg-white/10 text-zinc-300 px-1 border border-white/5 shadow-sm rounded">Cmd + K</kbd> Quick Log
            </p>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Type transaction... e.g. '28 bus' or '₹1500 Swiggy'"
                    value={inputValue}
                    onValueChange={setInputValue}
                    onKeyDown={handleKeyDown}
                />
                <CommandList>
                    {inputValue.length === 0 && (
                        <CommandEmpty>Awaiting input. Type amount and desc omni-directionally.</CommandEmpty>
                    )}

                    {inputValue.length > 0 && (!parsedData.amount || !parsedData.normalizedDesc) && (
                        <CommandEmpty>Please include both a valid amount and description.</CommandEmpty>
                    )}

                    {parsedData.amount && parsedData.normalizedDesc && (
                        <CommandGroup heading="Lexical Parser Engine">
                            <CommandItem
                                value={inputValue} // Fixes internal search hiding
                                onSelect={handleCreate}
                                className="cursor-pointer flex flex-col items-start gap-2 p-3"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <Plus className="h-5 w-5 text-zinc-100" strokeWidth={1.25} />
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-bold text-lg text-zinc-100 font-mono tracking-tight">
                                                ₹{parsedData.amount}
                                            </span>
                                            <span className="text-zinc-400 capitalize text-lg font-serif italic">
                                                {parsedData.normalizedDesc}
                                            </span>
                                        </div>
                                    </div>
                                    <span
                                        onClick={(e) => { e.stopPropagation(); cycleType(); }}
                                        className="cursor-pointer hidden sm:inline-flex text-xs text-zinc-500 items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity active:scale-95"
                                    >
                                        <kbd className="font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded border border-white/5 shadow-sm">Tab</kbd>
                                        to cycle type
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span
                                        onClick={(e) => { e.stopPropagation(); cycleType(); }}
                                        className={`cursor-pointer active:scale-95 transition-transform text-xs px-2.5 py-1 rounded-md font-medium border flex items-center gap-1.5 ${parsedData.type === 'INCOME' ? 'bg-zinc-100 text-zinc-900 border-zinc-300 font-bold' :
                                            parsedData.type === 'EXPENSE' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                            }`}>
                                        {parsedData.type === "INCOME" ? <TrendingUp className="h-3 w-3" strokeWidth={1.25} /> :
                                            parsedData.type === "EXPENSE" ? <TrendingDown className="h-3 w-3" strokeWidth={1.25} /> :
                                                <RefreshCcw className="h-3 w-3" strokeWidth={1.25} />}
                                        {parsedData.type} - {parsedData.category}
                                    </span>

                                    {manualType && (
                                        <span
                                            onClick={(e) => { e.stopPropagation(); setManualType(null); }}
                                            className="cursor-pointer active:scale-95 hover:bg-white/10 transition-colors text-[10px] font-semibold tracking-wider uppercase bg-white/5 text-zinc-300 border-white/10 border px-2 py-0.5 rounded shadow-sm"
                                        >
                                            Manual Override (Tap to reset)
                                        </span>
                                    )}
                                </div>
                            </CommandItem>
                        </CommandGroup>
                    )}

                    <CommandSeparator />
                </CommandList>
            </CommandDialog>
        </>
    );
};

export default GlobalCommandPalette;
