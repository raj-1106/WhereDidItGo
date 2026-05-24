import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import monthRoutes from './routes/monthRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://rlathigra11_db_user:<JkjysRrQEO9uCVZw>@ac-ibgcby0-shard-00-00.idm3pkr.mongodb.net:27017,ac-ibgcby0-shard-00-01.idm3pkr.mongodb.net:27017,ac-ibgcby0-shard-00-02.idm3pkr.mongodb.net:27017/?ssl=true&replicaSet=atlas-y7x77s-shard-0&authSource=admin&appName=Cluster0';

app.use(cors());
app.use(express.json());

app.use('/api', monthRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
