"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInsights = exports.deleteExpense = exports.addExpense = exports.upsertMonth = exports.getMonth = exports.getAllMonths = void 0;
const Month_1 = require("../models/Month");
// GET /api/months - get all months summary (this user only)
const getAllMonths = async (req, res) => {
    try {
        const months = await Month_1.Month.find({ userId: req.user.uid }, { expenses: 0 }).sort({
            year: -1,
            month: -1,
        });
        res.json(months);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch months' });
    }
};
exports.getAllMonths = getAllMonths;
// GET /api/months/:year/:month - get single month with expenses (this user only)
const getMonth = async (req, res) => {
    try {
        const { year, month } = req.params;
        const doc = await Month_1.Month.findOne({
            userId: req.user.uid,
            year: Number(year),
            month: Number(month),
        });
        if (!doc)
            return res.status(404).json({ error: 'Month not found' });
        res.json(doc);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch month' });
    }
};
exports.getMonth = getMonth;
// POST /api/months - create or update month salary (this user only)
const upsertMonth = async (req, res) => {
    try {
        const { year, month, salary } = req.body;
        if (!year || !month || salary === undefined) {
            return res.status(400).json({ error: 'year, month, and salary are required' });
        }
        const doc = await Month_1.Month.findOneAndUpdate({ userId: req.user.uid, year, month }, { $setOnInsert: { expenses: [] }, $set: { salary } }, { upsert: true, new: true, runValidators: true });
        res.status(201).json(doc);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create/update month' });
    }
};
exports.upsertMonth = upsertMonth;
// POST /api/months/:year/:month/expenses - add expense (this user only)
const addExpense = async (req, res) => {
    try {
        const { year, month } = req.params;
        const { description, amount, category, date } = req.body;
        if (!description || amount === undefined || !category) {
            return res.status(400).json({ error: 'description, amount, and category are required' });
        }
        const doc = await Month_1.Month.findOne({
            userId: req.user.uid,
            year: Number(year),
            month: Number(month),
        });
        if (!doc)
            return res.status(404).json({ error: 'Month not found. Set salary first.' });
        doc.expenses.push({ description, amount, category, date: date ? new Date(date) : new Date() });
        await doc.save();
        res.status(201).json(doc);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to add expense' });
    }
};
exports.addExpense = addExpense;
// DELETE /api/months/:year/:month/expenses/:expenseId (this user only)
const deleteExpense = async (req, res) => {
    try {
        const { year, month, expenseId } = req.params;
        const doc = await Month_1.Month.findOne({
            userId: req.user.uid,
            year: Number(year),
            month: Number(month),
        });
        if (!doc)
            return res.status(404).json({ error: 'Month not found' });
        doc.expenses = doc.expenses.filter((e) => e._id.toString() !== expenseId);
        await doc.save();
        res.json(doc);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete expense' });
    }
};
exports.deleteExpense = deleteExpense;
// GET /api/insights - multi-month analytics (this user only)
const getInsights = async (req, res) => {
    try {
        const months = await Month_1.Month.find({ userId: req.user.uid }).sort({ year: 1, month: 1 });
        const insights = months.map((m) => {
            const totalExpenses = m.expenses.reduce((sum, e) => sum + e.amount, 0);
            const categoryBreakdown = {};
            m.expenses.forEach((e) => {
                categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
            });
            return {
                year: m.year,
                month: m.month,
                salary: m.salary,
                totalExpenses,
                savings: m.salary - totalExpenses,
                savingsRate: m.salary > 0 ? ((m.salary - totalExpenses) / m.salary) * 100 : 0,
                categoryBreakdown,
                expenseCount: m.expenses.length,
            };
        });
        res.json(insights);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to compute insights' });
    }
};
exports.getInsights = getInsights;
