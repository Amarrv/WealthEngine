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

// TRAVEL / TRANSPORT
const EXPENSE_TRAVEL = [
    'bus', 'mtc', 'auto', 'rapido', 'uber', 'ola', 'metro', 'train', 'irctc',
    'flight', 'petrol', 'fuel', 'diesel', 'fastag', 'cab', 'redbus',
    'bike taxi', 'parking', 'toll', 'uber auto', 'ola bike'
];

// FOOD & GROCERIES
const EXPENSE_FOOD = [
    'swiggy', 'zomato', 'zepto', 'blinkit', 'instamart',
    'grocery', 'supermarket', 'reliance', 'more', 'dmart', 'spencer',
    'hotel', 'restaurant', 'cafe', 'bakery',
    'tea', 'chai', 'coffee',
    'breakfast', 'lunch', 'dinner', 'snacks',
    'juice', 'milk', 'aavin', 'water',
    'tasmac', // (optional: alcohol)
    'food court', 'mess', 'canteen'
];

// UTILITIES & BILLS
const EXPENSE_UTILITIES = [
    'tneb', 'electricity', 'eb bill',
    'jio', 'airtel', 'vi', 'bsnl',
    'act', 'hathway', 'wifi', 'broadband',
    'recharge', 'mobile bill',
    'gas', 'cylinder', 'lpg',
    'water bill', 'maintenance'
];

// INVESTMENTS & SAVINGS
const INVESTMENT_ASSETS = [
    'zerodha', 'groww', 'upstox', 'kite', 'coin',
    'mutual fund', 'sip', 'stock', 'shares',
    'crypto', 'bitcoin', 'ethereum',
    'gold', 'sgb',
    'ppf', 'epf', 'nps',
    'fd', 'fixed deposit', 'rd', 'recurring deposit'
];

// INCOME
const INCOME_MAIN = [
    'salary', 'bonus', 'incentive',
    'dividend', 'interest',
    'refund', 'cashback',
    'freelance', 'consulting',
    'upi credit', 'bank credit',
    'rent received', 'commission'
];
// Helper for substring match to tolerate inputs like '28bus' blending together
const hasMatch = (desc, arr) => {
    return arr.some(word => desc.includes(word));
};

const GlobalCommandPalette = () => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [manualType, setManualType] = useState(null); // Tracks Tab UI override
    const { addTransaction, transactions } = useContext(FinanceContext);

    // Global Cmd+K trigger
    useEffect(() => {
        const down = (e) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Reset override state when closing or clearing input
    useEffect(() => {
        if (!open || !inputValue) {
            setManualType(null);
        }
    }, [open, inputValue]);

    // PART 1 & 3: THE OMNI-DIRECTIONAL TOKENIZER AND DECISION MATRIX
    const parsedData = useMemo(() => {
        if (!inputValue) return { amount: null, normalizedDesc: "", type: "EXPENSE", category: "Misc" };

        // Amount Extraction: Global regex for any number, potentially prefixed with currency
        const amountRegex = /(?:₹|Rs\.?\s*)?(\d+(\.\d{1,2})?)/i;
        const amountMatch = inputValue.match(amountRegex);
        const amountStr = amountMatch ? amountMatch[1] : null;

        // Description Extraction: Strip the matched number string out of the raw input
        let rawDesc = inputValue;
        if (amountMatch) {
            rawDesc = rawDesc.replace(amountMatch[0], '');
        }

        // Remove leftover currency terms and ANY numbers/special chars to get pure word strings
        const normalizedDesc = rawDesc
            .replace(/[₹]/g, '')
            .replace(/Rs\.?/gi, '')
            .replace(/[0-9]/g, '') // remove trailing/leading leftover digits just in case
            .replace(/[^a-zA-Z\s]/g, '') // remove any stray symbols
            .trim()
            .toLowerCase();

        // Evaluate Decision Matrix Priorities
        let baseType = "EXPENSE"; // Level 3 (Fallback)
        let baseCategory = "Misc";

        // Level 1: Heuristic Priority (Strong Dictionary)
        if (hasMatch(normalizedDesc, EXPENSE_TRAVEL)) {
            baseType = "EXPENSE"; baseCategory = "Transport";
        } else if (hasMatch(normalizedDesc, EXPENSE_FOOD)) {
            baseType = "EXPENSE"; baseCategory = "Food";
        } else if (hasMatch(normalizedDesc, EXPENSE_UTILITIES)) {
            baseType = "EXPENSE"; baseCategory = "Housing";
        } else if (hasMatch(normalizedDesc, INVESTMENT_ASSETS)) {
            baseType = "INVESTMENT"; baseCategory = "Equities";
        } else if (hasMatch(normalizedDesc, INCOME_MAIN)) {
            baseType = "INCOME"; baseCategory = "Salary";
        } else {
            // Level 2: Historical Priority (Learn from unknown words)
            // Reverse to find the MOST RECENT past transaction, not the oldest
            const pastTx = [...transactions].reverse().find(t => t.description.toLowerCase() === normalizedDesc && normalizedDesc !== '');
            if (pastTx) {
                baseType = pastTx.type;
                baseCategory = pastTx.category;
            }
        }

        // Apply friction-less UI override if Tab was pressed
        const finalType = manualType || baseType;

        return { amount: amountStr, normalizedDesc, type: finalType, category: baseCategory };
    }, [inputValue, transactions, manualType]);

    // PART 4: THE FRICTIONLESS UI OVERRIDE (Tab Cycle Listener & Mobile Touch)
    const cycleType = () => {
        setManualType(prev => {
            const currentType = prev || parsedData.type;
            if (currentType === "EXPENSE") return "INCOME";
            if (currentType === "INCOME") return "INVESTMENT";
            return "EXPENSE";
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            cycleType();
        }
    };

    const handleCreate = async () => {
        const { amount, normalizedDesc, type, category } = parsedData;

        // Guard rails
        if (!amount || !normalizedDesc) return;

        // Capitalize sentence
        const formattedDesc = normalizedDesc.charAt(0).toUpperCase() + normalizedDesc.slice(1);

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
