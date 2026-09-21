import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

const app = createApp();

async function start() {
  try {
    await connectDB();
    app.listen(env.port, '0.0.0.0', () => {
      console.log(`\n  ▲ Meridian API listening on http://localhost:${env.port}`);
      console.log(`    Environment : ${env.nodeEnv}`);
      console.log(`    Allowed CORS: ${env.clientUrls.join(', ')}\n`);
    });
  } catch (err) {
    console.error('\n✖ Failed to start server:', err.message, '\n');
    process.exit(1);
  }
}

const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down.`);
  process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

start();
