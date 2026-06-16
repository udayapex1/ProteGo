
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import authMiddleware from './middlewares/auth.middleware.js';
import pairingRoutes from './routes/pairing.routes.js';
import locationRoutes from './routes/location.routes.js';
import userRoutes from './routes/user.routes.js';
import geofenceRoutes from './routes/geofence.routes.js';
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
// app.use(authMiddleware) ;


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pair', pairingRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/geofence', geofenceRoutes);
app.use('/api/user', userRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'Protego API running' });
});

export default app;
