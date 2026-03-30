import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import apiClient from "../api/apiClient";
import { startOfMonth } from "date-fns";

import { AuthContext } from "./AuthContext";

export const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });

  const [metrics, setMetrics] = useState({
    income: "0.00",
    expense: "0.00",
    investment: "0.00",
    savingsRate: "0.00",
  });
  const [rollingMetrics, setRollingMetrics] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);

  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize the fetch functions so they aren't recreated on every render
  const fetchMetrics = useCallback(async () => {
    try {
      let metricsUrl = "/transactions/metrics";
      // Add query params if dates are selected
      if (dateRange?.from && dateRange?.to) {
        metricsUrl += `?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`;
      }

      const [currentRes, rollingRes, heatmapRes] = await Promise.all([
        apiClient.get(metricsUrl),
        apiClient.get("/transactions/metrics/rolling-year"),
        apiClient.get("/transactions/metrics/heatmap"),
      ]);
      setMetrics(currentRes.data.data);
      setRollingMetrics(rollingRes.data.data);
      setHeatmapData(heatmapRes.data.data);
    } catch (err) {
      console.error("Failed to fetch metrics", err);
      setError("Failed to load dashboard metrics.");
    }
  }, [dateRange]);

  const fetchTransactions = useCallback(async () => {
    try {
      let url = "/transactions?page=1&limit=50";
      if (dateRange?.from && dateRange?.to) {
        url += `&startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`;
      }

      const response = await apiClient.get(url);
      setTransactions(response.data.data);
    } catch (err) {
      console.error("Failed to fetch ledger", err);
      setError("Failed to load transaction ledger.");
    }
  }, [dateRange]);

  const fetchGoals = useCallback(async () => {
    try {
      const response = await apiClient.get("/goals");
      setGoals(response.data.data);
    } catch (err) {
      console.error("Failed to fetch goals", err);
    }
  }, []);

  // The Initialization & Sync Sequence
  useEffect(() => {
    const syncData = async () => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      await Promise.all([fetchMetrics(), fetchTransactions(), fetchGoals()]);
      setIsLoading(false);
    };
    syncData();
  }, [fetchMetrics, fetchTransactions, isAuthenticated]);

  // The Mutator Function: Adds a transaction and instantly synchronizes the state
  const addTransaction = async (transactionData) => {
    try {
      await apiClient.post("/transactions", transactionData);
      // Immediately re-fetch metrics and ledger
      await Promise.all([fetchMetrics(), fetchTransactions()]);
      return { success: true };
    } catch (err) {
      console.error("Failed to add transaction", err);
      return {
        success: false,
        message: err.response?.data?.message || "Transaction failed",
      };
    }
  };

  const updateTransaction = async (id, updatedData) => {
    try {
      await apiClient.put(`/transactions/${id}`, updatedData);
      // Immediately re-fetch metrics and ledger
      await Promise.all([fetchMetrics(), fetchTransactions()]);
      return { success: true };
    } catch (err) {
      console.error("Failed to update transaction", err);
      return {
        success: false,
        message: err.response?.data?.message || "Update failed",
      };
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await apiClient.delete(`/transactions/${id}`);
      // Immediately re-fetch metrics and ledger
      await Promise.all([fetchMetrics(), fetchTransactions()]);
      return { success: true };
    } catch (err) {
      console.error("Failed to delete transaction", err);
      return {
        success: false,
        message: err.response?.data?.message || "Deletion failed",
      };
    }
  };

  const addGoal = async (goalData) => {
    try {
      await apiClient.post("/goals", goalData);
      await fetchGoals();
      return { success: true };
    } catch (err) {
      console.error("Failed to add goal", err);
      return { success: false, message: err.response?.data?.message || "Failed to create goal" };
    }
  };

  const addGoalFunds = async (goalId, amount) => {
    try {
      await apiClient.patch(`/goals/${goalId}/add-funds`, { amount });
      await Promise.all([fetchGoals(), fetchMetrics(), fetchTransactions()]);
      return { success: true };
    } catch (err) {
      console.error("Failed to add funds", err);
      return { success: false, message: err.response?.data?.message || "Failed to add funds" };
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      await apiClient.delete(`/goals/${goalId}`);
      await fetchGoals();
      return { success: true };
    } catch (err) {
      console.error("Failed to delete goal", err);
      return { success: false, message: err.response?.data?.message || "Deletion failed" };
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        dateRange,
        setDateRange,
        metrics,
        rollingMetrics,
        heatmapData,
        transactions,
        goals,
        isLoading,
        error,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addGoal,
        addGoalFunds,
        deleteGoal,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};
