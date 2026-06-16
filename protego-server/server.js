import app from './src/app.js';
import http from 'http';
import dotenv from 'dotenv';
import { initSocket } from './src/config/socket.js';
dotenv.config();



import connedtDB from './src/config/db.js';
import './src/config/redis.js'


const PORT = process.env.PORT || 5000;
connedtDB();
const server = http.createServer(app);
initSocket(server);
server.listen(PORT, () => {
  console.log(`Protego server running on port ${PORT}`);
}); 