import React, { useContext } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, startOfYear, endOfDay, startOfDay, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { FinanceContext } from "../context/FinanceContext";

const DateRangePicker = ({ className }) => {
    const { dateRange, setDateRange } = useContext(FinanceContext);

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
    const [isMobile, setIsMobile] = React.useState(false);
    React.useEffect(() => {
        const mql = window.matchMedia("(max-width: 640px)");
        setIsMobile(mql.matches);
        const listener = (e) => setIsMobile(e.matches);
        mql.addEventListener("change", listener);
        return () => mql.removeEventListener("change", listener);
    }, []);

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
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
                    className="w-auto p-0 flex flex-col sm:flex-row align-start bg-zinc-950/95 backdrop-blur-3xl border-white/10 text-zinc-300 shadow-2xl shadow-black rounded-xl overflow-hidden" 
                    align="end"
                >
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-col sm:gap-1 sm:pr-4 sm:border-r border-white/10 p-4 bg-zinc-900/20 border-b sm:border-b-0">
                        <h4 className="col-span-2 sm:col-span-1 text-xs font-semibold uppercase text-muted-foreground mb-1 tracking-wider">Presets</h4>
                        {presets.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="ghost"
                                className="justify-start text-xs sm:text-sm h-8 px-2 w-full sm:w-[140px] font-medium bg-white/5 sm:bg-transparent hover:bg-zinc-800/50 hover:text-zinc-100 text-zinc-400"
                                onClick={() => setDateRange(preset.getValue())}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                    <div className="p-2 mx-auto">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={isMobile ? 1 : 2}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default DateRangePicker;
