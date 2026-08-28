"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const monthController_1 = require("../controllers/monthController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Every route below requires a valid Bearer token; monthController relies
// on req.user being set here, so this must stay ahead of the route defs.
router.use(authMiddleware_1.authMiddleware);
router.get('/months', monthController_1.getAllMonths);
router.get('/months/:year/:month', monthController_1.getMonth);
router.post('/months', monthController_1.upsertMonth);
router.post('/months/:year/:month/expenses', monthController_1.addExpense);
router.delete('/months/:year/:month/expenses/:expenseId', monthController_1.deleteExpense);
router.get('/insights', monthController_1.getInsights);
router.post('/ai-advice', async (req, res) => {
    try {
        const { prompt } = req.body;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }],
            }),
        });
        const data = await response.json();
        console.log("Groq status:", response.status);
        console.log("Groq response:", JSON.stringify(data, null, 2));
        res.status(response.status).json(data);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message,
        });
    }
});
exports.default = router;
