import express from 'express';
import cors from 'cors';
import monthRoutes from './routes/monthRoutes';
import authRoutes from './routes/authRoutes';

const app = express();

app.use(cors());
// Bulk import can legitimately be a larger payload (a year of expenses
// across many months); every other route stays at the conservative
// default. Must be mounted before the global express.json() below,
// body-parser skips re-parsing a body it's already consumed, so whichever
// matching parser runs first for a given path wins.
app.use('/api/months/bulk', express.json({ limit: '2mb' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', monthRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default app;
