import express from 'express';
import cors from 'cors';
import monthRoutes from './routes/monthRoutes';
import authRoutes from './routes/authRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', monthRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default app;
