
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import authMiddleware from './middlewares/auth.middleware.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
// app.use(authMiddleware) ;


// Routes
app.use('/api/auth', authRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'Protego API running' });
});

export default app;