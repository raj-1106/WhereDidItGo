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

export default router;
