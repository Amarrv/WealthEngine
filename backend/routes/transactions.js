const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const validateTransaction = require("../middleware/validateTransaction");
const requireAuth = require("../middleware/requireAuth");
const Decimal = require("decimal.js");

// Apply authentication to ALL transaction routes
router.use(requireAuth);

// POST /api/transactions - Insert a new transaction
router.post("/", validateTransaction, async (req, res) => {
  try {
    const { amount, type, category, description, date } = req.body;

    // Convert the validated string to a MongoDB Decimal128 type
    // This absolutely prevents floating-point corruption in your ledger
    const decimalAmount = mongoose.Types.Decimal128.fromString(amount);

    const newTransaction = new Transaction({
      userId: req.user.id,
      amount: decimalAmount,
      type,
      category,
      description,
      // If no date is provided by the frontend, Mongoose will default to Date.now
      date: date ? new Date(date) : undefined,
    });

    const savedTransaction = await newTransaction.save();

    res.status(201).json({
      success: true,
      data: savedTransaction,
    });
  } catch (error) {
    console.error("Transaction Save Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error during transaction ingestion.",
    });
  }
});

// ... existing POST route ...

// GET /api/transactions/metrics - Fetch aggregated metrics with optional date range
router.get("/metrics", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to MTD if no params provided
    let firstDay, lastDay;
    if (startDate && endDate) {
      firstDay = new Date(startDate);
      lastDay = new Date(endDate);
    } else {
      const now = new Date();
      firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // 1. Existing Pipeline: High-level totals
    const totalsPipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id), date: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: "$type", totalAmount: { $sum: "$amount" } } },
    ];

    // 2. NEW Pipeline: Outflow Category Breakdown (Expense + Investment)
    const categoryPipeline = [
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(req.user.id), 
          date: { $gte: firstDay, $lte: lastDay }, 
          type: { $in: ["EXPENSE", "INVESTMENT"] } 
        } 
      },
      { $group: { _id: "$category", categoryTotal: { $sum: "$amount" } } },
      { $sort: { categoryTotal: -1 } }, // Sort largest outflows first
    ];

    // Execute both queries concurrently for maximum speed
    const [totalsResults, categoryResults] = await Promise.all([
      Transaction.aggregate(totalsPipeline),
      Transaction.aggregate(categoryPipeline),
    ]);

    // Process Totals (Existing Logic)
    let income = new Decimal(0);
    let expense = new Decimal(0);
    let investment = new Decimal(0);

    totalsResults.forEach((result) => {
      const val = new Decimal(result.totalAmount.toString());
      if (result._id === "INCOME") income = val;
      if (result._id === "EXPENSE") expense = val;
      if (result._id === "INVESTMENT") investment = val;
    });

    let savingsRate = new Decimal(0);
    if (income.greaterThan(0)) {
      savingsRate = income.minus(expense).dividedBy(income).times(100);
    }

    // Process Category Breakdown for Recharts
    const expenseBreakdown = categoryResults.map((cat) => ({
      name: cat._id,
      // Recharts needs numbers, so we safely parse the Decimal128 string to a float
      value: parseFloat(cat.categoryTotal.toString()),
    }));

    res.status(200).json({
      success: true,
      data: {
        range: {
          from: firstDay.toISOString(),
          to: lastDay.toISOString(),
        },
        income: income.toFixed(2),
        expense: expense.toFixed(2),
        investment: investment.toFixed(2),
        savingsRate: savingsRate.toFixed(2),
        expenseBreakdown, // Injecting the new data array into the payload
      },
    });
  } catch (error) {
    console.error("Metrics Aggregation Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to aggregate metrics." });
  }
});
// GET /api/transactions - Fetch the ledger with basic pagination and date filtering
router.get("/", async (req, res) => {
  try {
    // Default to page 1, 20 items per page
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { startDate, endDate } = req.query;

    let matchStage = { userId: req.user.id };
    if (startDate && endDate) {
      matchStage.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
      };
    } else {
      // Default fallback to MTD to prevent massive DB loads
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      matchStage.date = {
          $gte: firstDay,
          $lte: lastDay
      };
    }

    const transactions = await Transaction.find(matchStage)
      .sort({ date: -1 }) // Newest first
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(matchStage);

    // Convert Decimal128 to strings for safe JSON transmission to React
    const safeTransactions = transactions.map((tx) => ({
      ...tx._doc,
      amount: tx.amount.toString(),
    }));

    res.status(200).json({
      success: true,
      data: safeTransactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Ledger Fetch Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch ledger." });
  }
});

// GET /api/transactions/metrics/rolling-year
router.get("/metrics/rolling-year", async (req, res) => {
  try {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);

    const pipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id), date: { $gte: oneYearAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type"
          },
          total: { $sum: "$amount" }
        }
      }
    ];

    const results = await Transaction.aggregate(pipeline);

    // Transform to array of 12 months
    const monthlyData = {};

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = {
        name: d.toLocaleString('default', { month: 'short' }),
        income: 0,
        expense: 0
      };
    }

    results.forEach(r => {
      const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
      if (monthlyData[key]) {
        const val = parseFloat(r.total.toString());
        if (r._id.type === "INCOME") monthlyData[key].income += val;
        if (r._id.type === "EXPENSE") monthlyData[key].expense += val;
      }
    });

    const formattedData = Object.keys(monthlyData).sort().map(key => {
      const item = monthlyData[key];
      const savingsRate = item.income > 0 ? ((item.income - item.expense) / item.income) * 100 : 0;
      return {
        ...item,
        savingsRate: parseFloat(savingsRate.toFixed(2))
      };
    });

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Rolling Year Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch rolling year metrics." });
  }
});

// GET /api/transactions/metrics/heatmap
router.get("/metrics/heatmap", async (req, res) => {
  try {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setDate(now.getDate() - 365);

    const pipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id), date: { $gte: oneYearAgo } } },
      {
        $group: {
          _id: {
            dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            type: "$type"
          },
          total: { $sum: "$amount" }
        }
      }
    ];

    const results = await Transaction.aggregate(pipeline);

    // Transform into { date: { expense, income } }
    const dailyMap = {};
    results.forEach(r => {
      const date = r._id.dateStr;
      if (!dailyMap[date]) dailyMap[date] = { expense: 0, income: 0 };

      const val = parseFloat(r.total.toString());
      if (r._id.type === "EXPENSE") dailyMap[date].expense += val;
      if (r._id.type === "INCOME") dailyMap[date].income += val;
    });

    const data = Object.keys(dailyMap).map(date => ({
      date,
      expense: dailyMap[date].expense,
      income: dailyMap[date].income
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Heatmap Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch heatmap data." });
  }
});

// PUT /api/transactions/:id - Update an existing transaction
router.put("/:id", validateTransaction, async (req, res) => {
  try {
    const { amount, type, category, description, date } = req.body;
    const { id } = req.params;

    // Convert amount to Decimal128
    const decimalAmount = mongoose.Types.Decimal128.fromString(amount);

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        amount: decimalAmount,
        type,
        category,
        description,
        date: date ? new Date(date) : undefined,
      },
      { new: true } // Return the updated document
    );

    if (!updatedTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found or unauthorized.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...updatedTransaction._doc,
        amount: updatedTransaction.amount.toString(),
      },
    });
  } catch (error) {
    console.error("Transaction Update Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error during transaction update.",
    });
  }
});

// DELETE /api/transactions/:id - Remove a transaction
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTransaction = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!deletedTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found or unauthorized.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    console.error("Transaction Delete Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error during transaction deletion.",
    });
  }
});

module.exports = router;
