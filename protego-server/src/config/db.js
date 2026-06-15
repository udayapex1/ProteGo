import mongoose from "mongoose";
import chalk from "chalk";

const connedtDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(chalk.green(`[MongoDB] Connected -> ${conn.connection.host}`));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
export default connedtDB;
