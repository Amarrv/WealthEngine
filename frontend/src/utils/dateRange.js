// utils/dateRange.js

import { startOfDay, endOfDay } from "date-fns";

/**
 * Normalize a date range to safe boundaries
 */
export const normalizeRange = (range) => {
    if (!range) return undefined;

    const from = range.from ? startOfDay(new Date(range.from)) : undefined;
    const to = range.to ? endOfDay(new Date(range.to)) : undefined;

    // Auto-fix invalid range
    if (from && to && from > to) {
        return { from: to, to: from };
    }

    return { from, to };
};

/**
 * Parse input date safely (from input[type="date"])
 */
export const parseInputDate = (value, type = "start") => {
    if (!value) return undefined;

    const date = new Date(value);
    return type === "start" ? startOfDay(date) : endOfDay(date);
};

/**
 * Safe date range filter
 */
export const isWithinRange = (date, range) => {
    if (!range?.from && !range?.to) return true;

    const d = new Date(date);

    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;

    return true;
};