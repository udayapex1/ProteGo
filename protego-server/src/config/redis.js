import  {createClient} from 'redis';

import dotenv from 'dotenv';
dotenv.config();
const redisClient = createClient({
     url: process.env.REDIS_URL
})

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis connected'));

await redisClient.connect();
export default redisClient;