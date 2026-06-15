import  {createClient} from 'redis';
import dotenv from 'dotenv';
import chalk from "chalk";
dotenv.config();
const redisClient = createClient({
     url: process.env.REDIS_URL
})

redisClient.on("connect", () => {
  console.log(chalk.green("[Redis] Connected successfully"));
});

redisClient.on("error", (err) => {
  console.error(chalk.red("[Redis] Connection failed:"), err.message);
});
await redisClient.connect();
export default redisClient;