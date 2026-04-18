import React, { createContext, useState, useEffect, useCallback, useContext, useMemo, useRef } from "react";
import apiClient from "../api/apiClient";
import { startOfMonth, endOfMonth } from "date-fns";

import { AuthContext } from "./AuthContext";

export const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // Load Initial State from Cache (Standard SWR Pattern)
  const getCache = (key, fallback) => {
    try {
      const cached = localStorage.getItem(`wealth_engine_${key}`);
      return cached ? JSON.parse(cached) : fallback;
    } catch { return fallback; }
  };

  const [metrics, setMetrics] = useState(() => getCache('metrics', {
    income: "0.00",
    expense: "0.00",
    investment: "0.00",
    savingsRate: "0.00",
    expenseBreakdown: []
  }));
  const [rollingMetrics, setRollingMetrics] = useState(() => getCache('rolling', []));
  const [heatmapData, setHeatmapData] = useState(() => getCache('heatmap', []));
  const [transactions, setTransactions] = useState(() => getCache('transactions', []));
  const [goals, setGoals] = useState(() => getCache('goals', []));

  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('wealth_engine_metrics'));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isInitialLoad = useRef(true);
  const [error, setError] = useState(null);

  // Persistence Sync
  useEffect(() => {
    localStorage.setItem('wealth_engine_metrics', JSON.stringify(metrics));
    localStorage.setItem('wealth_engine_transactions', JSON.stringify(transactions));
    localStorage.setItem('wealth_engine_goals', JSON.stringify(goals));
    localStorage.setItem('wealth_engine_rolling', JSON.stringify(rollingMetrics));
    localStorage.setItem('wealth_engine_heatmap', JSON.stringify(heatmapData));
  }, [metrics, transactions, goals, rollingMetrics, heatmapData]);

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

  // The Consolidated Initialization Sequence
  useEffect(() => {
    const syncData = async () => {
      if (!isAuthenticated) return;
      
      setIsRefreshing(true);
      try {
        // Fetch initialization packet + background metrics
        const [initRes, rollingRes, heatmapRes] = await Promise.all([
          apiClient.get("/transactions/init"),
          apiClient.get("/transactions/metrics/rolling-year"),
          apiClient.get("/transactions/metrics/heatmap"),
        ]);

        const { metrics: m, transactions: t, goals: g } = initRes.data.data;
        setMetrics(m);
        setTransactions(t);
        setGoals(g);
        setRollingMetrics(rollingRes.data.data);
        setHeatmapData(heatmapRes.data.data);
        
        isInitialLoad.current = false;
      } catch (err) {
        console.error("Dashboard Sync Failed:", err);
        setError("Network error. Showing cached data.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };
    syncData();
  }, [isAuthenticated]);

  // TRULY OPTIMISTIC MUTATORS
  const addTransaction = async (transactionData) => {
    const tempId = Date.now().toString();
    const optimisticTx = { ...transactionData, _id: tempId, amount: transactionData.amount.toString() };
    
    // Save snapshots for rollback
    const prevTxs = [...transactions];
    const prevMetrics = { ...metrics };

    try {
      // 1. Update State BEFORE API Call
      setTransactions(prev => [optimisticTx, ...prev].slice(0, 50));
      setMetrics(prev => {
        const amt = parseFloat(transactionData.amount);
        const next = { ...prev };
        if (transactionData.type === "INCOME") next.income = (parseFloat(prev.income) + amt).toFixed(2);
        else if (transactionData.type === "EXPENSE") next.expense = (parseFloat(prev.expense) + amt).toFixed(2);
        else if (transactionData.type === "INVESTMENT") next.investment = (parseFloat(prev.investment) + amt).toFixed(2);
        
        const inc = parseFloat(next.income);
        next.savingsRate = inc > 0 ? (((inc - parseFloat(next.expense)) / inc) * 100).toFixed(2) : "0.00";
        return next;
      });

      // 2. Perform API Call
      const response = await apiClient.post("/transactions", transactionData);
      
      // 3. Swap temp item with real item from DB
      setTransactions(prev => prev.map(t => t._id === tempId ? response.data.data : t));
      
      // Background full sync to ensure charts are correct
      fetchMetrics(); 
      return { success: true };
    } catch (err) {
      // ROLLBACK on failure
      setTransactions(prevTxs);
      setMetrics(prevMetrics);
      return { success: false, message: "Sync failed. Transaction reverted." };
    }
  };

  const updateTransaction = async (id, updatedData) => {
    const prevTxs = [...transactions];
    try {
      // Simple optimistic list update
      setTransactions(prev => prev.map(t => t._id === id ? { ...t, ...updatedData } : t));
      
      await apiClient.put(`/transactions/${id}`, updatedData);
      fetchMetrics();
      fetchTransactions();
      return { success: true };
    } catch (err) {
      setTransactions(prevTxs);
      return { success: false, message: "Update failed." };
    }
  };

  const deleteTransaction = async (id) => {
    const prevTxs = [...transactions];
    const prevMetrics = { ...metrics };
    const deletedTx = transactions.find(t => t._id === id);

    try {
      if (deletedTx) {
        setTransactions(prev => prev.filter(t => t._id !== id));
        setMetrics(prev => {
          const amt = parseFloat(deletedTx.amount);
          const next = { ...prev };
          if (deletedTx.type === "INCOME") next.income = (parseFloat(prev.income) - amt).toFixed(2);
          else if (deletedTx.type === "EXPENSE") next.expense = (parseFloat(prev.expense) - amt).toFixed(2);
          else if (deletedTx.type === "INVESTMENT") next.investment = (parseFloat(prev.investment) - amt).toFixed(2);
          
          const inc = parseFloat(next.income);
          next.savingsRate = inc > 0 ? (((inc - parseFloat(next.expense)) / inc) * 100).toFixed(2) : "0.00";
          return next;
        });
      }

      await apiClient.delete(`/transactions/${id}`);
      fetchMetrics();
      return { success: true };
    } catch (err) {
      setTransactions(prevTxs);
      setMetrics(prevMetrics);
      return { success: false, message: "Deletion failed." };
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

  const providerValue = useMemo(() => ({
    dateRange,
    setDateRange,
    metrics,
    rollingMetrics,
    heatmapData,
    transactions,
    goals,
    isLoading,
    isRefreshing,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addGoal,
    addGoalFunds,
    deleteGoal,
  }), [
    dateRange, 
    metrics, 
    rollingMetrics, 
    heatmapData, 
    transactions, 
    goals, 
    isLoading, 
    isRefreshing, 
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addGoal,
    addGoalFunds,
    deleteGoal
  ]);

  return (
    <FinanceContext.Provider value={providerValue}>
      {children}
    </FinanceContext.Provider>
  );
};
