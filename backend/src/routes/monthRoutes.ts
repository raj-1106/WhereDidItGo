import { Router } from 'express';
import {
  getAllMonths,
  getMonth,
  upsertMonth,
  addExpense,
  deleteExpense,
  deleteMonth,
  getInsights,
  bulkImportMonths,
} from '../controllers/monthController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Every route below requires a valid Bearer token; monthController relies
// on req.user being set here, so this must stay ahead of the route defs.
router.use(authMiddleware);

router.get('/months', getAllMonths);
router.get('/months/:year/:month', getMonth);
router.post('/months', upsertMonth);
router.post('/months/bulk', bulkImportMonths);
router.delete('/months/:year/:month', deleteMonth);
router.post('/months/:year/:month/expenses', addExpense);
router.delete('/months/:year/:month/expenses/:expenseId', deleteExpense);
router.get('/insights', getInsights);
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
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      error: err.message,
  });
}
});

export default router;
