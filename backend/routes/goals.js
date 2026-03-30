const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Goal = require("../models/Goal");
const requireAuth = require("../middleware/requireAuth");

router.use(requireAuth);

// GET /api/goals - Fetch all active targets for the user
router.get("/", async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ targetDate: 1 });
    
    // Convert Decimal128 to strings for React stability
    const safeGoals = goals.map((goal) => ({
      ...goal._doc,
      targetAmount: goal.targetAmount.toString(),
      currentSaved: goal.currentSaved.toString(),
    }));

    res.status(200).json({
      success: true,
      data: safeGoals,
    });
  } catch (error) {
    console.error("Goals Fetch Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch goals" });
  }
});

// POST /api/goals - Create a new specific target
router.post("/", async (req, res) => {
  try {
    const { name, targetAmount, targetDate, icon } = req.body;

    const newGoal = new Goal({
      userId: req.user.id,
      name,
      targetAmount: mongoose.Types.Decimal128.fromString(targetAmount.toString()),
      targetDate: new Date(targetDate),
      icon: icon || "Target",
      currentSaved: mongoose.Types.Decimal128.fromString("0"),
    });

    await newGoal.save();

    res.status(201).json({
      success: true,
      data: {
        ...newGoal._doc,
        targetAmount: newGoal.targetAmount.toString(),
        currentSaved: newGoal.currentSaved.toString(),
      },
    });
  } catch (error) {
    console.error("Goal Creation Error:", error);
    res.status(500).json({ success: false, message: "Failed to create goal" });
  }
});

// PATCH /api/goals/:id/add-funds - Increment currentSaved for a specific goal
router.patch("/:id/add-funds", async (req, res) => {
  try {
    const { amount } = req.body;
    const { id } = req.params;

    const goal = await Goal.findOne({ _id: id, userId: req.user.id });
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });

    const currentVal = parseFloat(goal.currentSaved.toString());
    const increment = parseFloat(amount.toString());
    
    goal.currentSaved = mongoose.Types.Decimal128.fromString((currentVal + increment).toFixed(2));
    await goal.save();

    res.status(200).json({
      success: true,
      data: {
        ...goal._doc,
        targetAmount: goal.targetAmount.toString(),
        currentSaved: goal.currentSaved.toString(),
      },
    });
  } catch (error) {
    console.error("Goal Update Error:", error);
    res.status(500).json({ success: false, message: "Failed to update goal funds" });
  }
});

// DELETE /api/goals/:id - Remove a target
router.delete("/:id", async (req, res) => {
  try {
    const deletedGoal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deletedGoal) return res.status(404).json({ success: false, message: "Goal not found" });
    
    res.status(200).json({ success: true, message: "Goal deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete goal" });
  }
});

module.exports = router;
