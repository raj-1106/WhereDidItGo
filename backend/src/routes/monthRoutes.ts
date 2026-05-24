import { Router } from 'express';
import {
  getAllMonths,
  getMonth,
  upsertMonth,
  addExpense,
  deleteExpense,
  getInsights,
} from '../controllers/monthController';

const router = Router();

router.get('/months', getAllMonths);
router.get('/months/:year/:month', getMonth);
router.post('/months', upsertMonth);
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
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'AI request failed' });
  }
});

export default router;
