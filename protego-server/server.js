import app from './src/app.js';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import connedtDB from './src/config/db.js';
import './src/config/redis.js'


const PORT = process.env.PORT || 5000;
connedtDB();
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Protego server running on port ${PORT}`);
}); 