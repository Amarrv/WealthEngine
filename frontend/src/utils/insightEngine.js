import { differenceInMonths, parseISO } from "date-fns";

/**
 * AI Insight Engine
 * Generates actionable financial insights from raw metrics, transactions, and goals.
 * Structured for future replacement by Gemini API.
 */
export const generateInsights = (metrics, transactions, goals, rollingMetrics) => {
  const insights = [];
  const income = parseFloat(metrics.income || 0);
  const expense = parseFloat(metrics.expense || 0);
  const savings = Math.max(0, income - expense);
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  // 1. Calculate Health Score
  const health = calculateHealthScore(savingsRate, expense, income, goals);

  // 2. Leak Detection (Rule-based)
  const leaks = detectLeaks(metrics, transactions, income);
  insights.push(...leaks);

  // 3. Goal Coaching
  const coaching = coachGoals(goals, savings);
  insights.push(...coaching);

  // Sort insights by priority (HIGH -> LOW)
  insights.sort((a, b) => {
    const priorityMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return priorityMap[b.priority] - priorityMap[a.priority];
  });

  return {
    health,
    insights
  };
};

const calculateHealthScore = (savingsRate, expense, income, goals) => {
  let score = 0;
  let reasons = [];
  let fixes = [];

  // Savings Component (40%)
  if (savingsRate >= 30) score += 40;
  else if (savingsRate >= 15) score += 25;
  else if (savingsRate > 0) score += 10;
  else reasons.push("Critical: Monthly expenses match or exceed income.");

  // Budget Discipline (30%)
  const ratio = income > 0 ? expense / income : 1;
  if (ratio < 0.6) score += 30;
  else if (ratio < 0.8) score += 15;
  else reasons.push("High discretionary spending detected.");

  // Goal Pace (30%)
  if (goals.length > 0) {
    const validGoals = goals.filter(g => parseFloat(g.targetAmount) > 0);
    if (validGoals.length > 0) {
      const avgProgress = validGoals.reduce((acc, g) => {
        const target = parseFloat(g.targetAmount);
        const current = parseFloat(g.currentSaved || 0);
        return acc + (current / target);
      }, 0) / validGoals.length;
      score += Math.min(30, avgProgress * 100 * 0.3);
    }
  }

  // Final text generation
  let explanation = "Your financial health is stable.";
  if (score < 40) {
    explanation = "Action Required: Your financial buffer is thin.";
    fixes.push("Reduce non-essential spending immediately to build an emergency fund.");
  } else if (score < 75) {
    explanation = "Good Progress: You have a decent margin but room for optimization.";
    fixes.push("Identify recurring subscriptions or small daily spends to accelerate goals.");
  } else {
    explanation = "Excellent: You are in the top tier of financial discipline.";
    fixes.push("Consider increasing your investments to leverage your high savings rate.");
  }

  return {
    score: Math.round(score),
    explanation,
    reason: reasons[0] || "Stable spending and consistent baseline.",
    fix: fixes[0]
  };
};

const detectLeaks = (metrics, transactions, income) => {
  const leaks = [];
  const breakdown = metrics.expenseBreakdown || [];

  // A. High Spending Categories
  breakdown.forEach(cat => {
    if (cat.value > (income * 0.35)) {
      leaks.push({
        id: `leak-${cat.name}`,
        priority: "HIGH",
        type: "LEAK",
        title: `${cat.name} spending is high`,
        problem: `${cat.name} accounts for ${Math.round((cat.value / income) * 100)}% of your income.`,
        action: `Limit ${cat.name} to ₹${Math.round(income * 0.25).toLocaleString('en-IN')}/month`,
        impact: `Saving ₹${Math.round((cat.value - (income * 0.25)) * 12).toLocaleString('en-IN')}/year`,
      });
    }
  });

  // B. Micro-Leaks (Small frequent spends)
  const smallSpends = transactions.filter(t => t.type === "EXPENSE" && parseFloat(t.amount) > 100 && parseFloat(t.amount) < 500);
  const groupedByCat = smallSpends.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  Object.entries(groupedByCat).forEach(([cat, count]) => {
    if (count >= 5) {
      const totalAmount = smallSpends.filter(t => t.category === cat).reduce((sum, t) => sum + parseFloat(t.amount), 0);
      leaks.push({
        id: `micro-${cat}`,
        priority: "MEDIUM",
        type: "PATTERN",
        title: `Frequent small spends in ${cat}`,
        problem: `Detected ${count} transactions in ${cat} adding up to ₹${totalAmount.toLocaleString('en-IN')}.`,
        action: `Try to batch or reduce frequency of ${cat} purchases.`,
        impact: `Saving ₹${Math.round(totalAmount * 0.3 * 12).toLocaleString('en-IN')}/year by cutting 30% of frequency.`,
      });
    }
  });

  return leaks;
};

const coachGoals = (goals, currentSavings) => {
  const tips = [];

  goals.forEach(goal => {
    const target = parseFloat(goal.targetAmount || 0);
    const current = parseFloat(goal.currentSaved || 0);
    const remaining = target - current;
    if (remaining <= 0 || target <= 0) return;

    const targetDate = parseISO(goal.targetDate);
    // Ensure monthsLeft is at least 1 to avoid division by zero
    const monthsLeft = Math.max(1, differenceInMonths(targetDate, new Date()));
    const requiredPerMonth = remaining / monthsLeft;

    if (requiredPerMonth > currentSavings) {
      const shortfall = requiredPerMonth - currentSavings;
      tips.push({
        id: `goal-${goal._id}`,
        priority: "HIGH",
        type: "GOAL",
        title: `Goal "${goal.name || 'Untitled'}" is in danger`,
        problem: `You need ₹${Math.round(requiredPerMonth).toLocaleString('en-IN')}/mo but currently save ₹${Math.round(currentSavings).toLocaleString('en-IN')}/mo.`,
        action: `Bridge the ₹${Math.round(shortfall).toLocaleString('en-IN')}/mo gap by optimizing discretionary spend.`,
        impact: `Reach your goal by ${goal.targetDate.split('T')[0]} instead of delaying.`,
      });
    } else if (requiredPerMonth > (currentSavings * 0.8)) {
      tips.push({
        id: `goal-${goal._id}`,
        priority: "MEDIUM",
        type: "GOAL",
        title: `Stay focused on "${goal.name || 'Untitled'}"`,
        problem: `Goal consumes ${Math.round((requiredPerMonth / currentSavings) * 100)}% of your monthly capacity.`,
        action: `Keep your discretionary spending in check this month.`,
        impact: `Build a safety margin for your target date.`,
      });
    }
  });

  return tips;
};
