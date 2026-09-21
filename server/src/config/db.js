import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

/** Connect to MongoDB with sensible defaults and useful logging. */
export async function connectDB(uri = env.mongoUri) {
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: !env.isProd,
  });
  console.log(`  ✔ MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
