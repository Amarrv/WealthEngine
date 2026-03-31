import React, { useContext, useState, useEffect } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, startOfYear, endOfDay, startOfDay, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { FinanceContext } from "../context/FinanceContext";
import { normalizeRange, parseInputDate } from "@/utils/dateRange";

const DateRangePicker = ({ className }) => {
    const { dateRange, setDateRange } = useContext(FinanceContext);
    
    // UI States
    const [open, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    // Draft State explicitly isolates selection until "Confirm" is clicked
    const [draftRange, setDraftRange] = useState(dateRange);

    useEffect(() => {
        const mql = window.matchMedia("(max-width: 640px)");
        setIsMobile(mql.matches);
        const listener = (e) => setIsMobile(e.matches);
        mql.addEventListener("change", listener);
        return () => mql.removeEventListener("change", listener);
    }, []);

    // Sync draft range to valid global dateRange whenever popover opens
    useEffect(() => {
        if (open) {
            setDraftRange(dateRange);
        }
    }, [open, dateRange]);

    const presets = [
        {
            label: "Today (T-0)",
            getValue: () => {
                const today = new Date();
                return { from: startOfDay(today), to: endOfDay(today) };
            },
        },
        {
            label: "Yesterday (T-1)",
            getValue: () => {
                const yesterday = subDays(new Date(), 1);
                return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
            },
        },
        {
            label: "Week to Date",
            getValue: () => {
                const today = new Date();
                return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfDay(today) };
            },
        },
        {
            label: "Month to Date",
            getValue: () => {
                const today = new Date();
                return { from: startOfMonth(today), to: endOfDay(today) };
            },
        },
        {
            label: "Year to Date",
            getValue: () => {
                const today = new Date();
                return { from: startOfYear(today), to: endOfDay(today) };
            },
        },
        {
            label: "All Time",
            getValue: () => {
                const initial = new Date("2020-01-01");
                const today = new Date();
                return { from: startOfDay(initial), to: endOfDay(today) };
            },
        }
    ];

    const handleApplyPreset = (getValue) => {
        const range = getValue();
        setDraftRange(range);
        
        // Instant apply & close for presets (better UX)
        if (range?.from || range?.to) {
            setDateRange(normalizeRange(range));
        }
        setOpen(false);
    };

    const handleConfirm = () => {
        if (draftRange?.from || draftRange?.to) {
            setDateRange(normalizeRange(draftRange));
        }
        setOpen(false);
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full md:w-[280px] lg:w-[300px] justify-start text-left font-normal bg-zinc-900/40 backdrop-blur-xl border border-white/10 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 hover:border-white/20 transition-all",
                            !dateRange && "text-zinc-500"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-0 flex flex-col align-start bg-zinc-950/95 backdrop-blur-3xl border-white/10 text-zinc-300 shadow-2xl shadow-black rounded-xl overflow-hidden"
                    align="end"
                >
                    <div className="flex flex-col sm:flex-row">
                        {/* PRESETS SIDEBAR */}
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-col sm:gap-1 sm:pr-4 sm:border-r border-white/10 p-4 bg-zinc-900/20 border-b sm:border-b-0 max-h-[300px] overflow-y-auto w-full sm:w-auto">
                            <h4 className="col-span-2 sm:col-span-1 text-xs font-semibold uppercase text-muted-foreground mb-1 tracking-wider">Presets</h4>
                            {presets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    className="justify-start text-xs sm:text-sm h-8 px-2 w-full sm:w-[140px] font-medium bg-white/5 sm:bg-transparent hover:bg-zinc-800/50 hover:text-zinc-100 text-zinc-400"
                                    onClick={() => handleApplyPreset(preset.getValue)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>

                        {/* CALENDAR & INPUTS */}
                        <div className="flex flex-col w-full">
                            {/* EXPLICIT RANGE INPUTS */}
                            <div className="flex items-center justify-between p-4 border-b border-white/10 gap-4 bg-zinc-900/40">
                                <div className="flex flex-col w-full">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={draftRange?.from ? format(draftRange.from, 'yyyy-MM-dd') : ''}
                                        onChange={(e) => setDraftRange(prev => normalizeRange({ ...prev, from: e.target.value ? parseInputDate(e.target.value, "start") : undefined }))}
                                        className="bg-transparent text-sm w-full text-zinc-200 border-b border-zinc-700 pb-1 focus:outline-none focus:border-blue-500 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.7]"
                                    />
                                </div>
                                <div className="flex flex-col w-full">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={draftRange?.to ? format(draftRange.to, 'yyyy-MM-dd') : ''}
                                        onChange={(e) => setDraftRange(prev => normalizeRange({ ...prev, to: e.target.value ? parseInputDate(e.target.value, "end") : undefined }))}
                                        className="bg-transparent text-sm w-full text-zinc-200 border-b border-zinc-700 pb-1 focus:outline-none focus:border-blue-500 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.7]"
                                    />
                                </div>
                            </div>

                            {/* CALENDAR SELECTION WIDGET */}
                            <div className="p-2 mx-auto pointer-events-auto">
                                <Calendar
                                    mode="range"
                                    defaultMonth={draftRange?.from}
                                    selected={draftRange}
                                    onSelect={(range) => setDraftRange(range ? normalizeRange(range) : undefined)}
                                    numberOfMonths={isMobile ? 1 : 2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* CONFIRMATION STRIP */}
                    <div className="flex justify-between items-center bg-zinc-900 border-t border-white/10 p-3">
                        <span className="text-xs text-zinc-500 ml-2">Click Apply Filter to save your selection</span>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
                            <Button size="sm" onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50">
                                <Check className="w-4 h-4 mr-1" /> Apply Filter
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default DateRangePicker;