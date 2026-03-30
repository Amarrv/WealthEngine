const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: {
        validator: function (v) {
          // Ensure the amount is always positive in the database.
          // The 'type' dictates if it's an inflow or outflow.
          return v >= 0;
        },
        message: "Amount must be a positive number.",
      },
    },
    type: {
      type: String,
      required: true,
      enum: ["INCOME", "EXPENSE", "INVESTMENT"], // Strict categorization
      index: true, // Indexed for fast querying
    },
    category: {
      type: String,
      required: true,
      trim: true,
      // E.g., "Salary", "Food", "Rent", "Index Fund"
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true, // Indexed for fast monthly aggregations
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Compound index to instantly fetch a specific user's specific month's income/expenses
transactionSchema.index({ userId: 1, date: -1, type: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
