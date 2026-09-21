/**
 * Zero-install MongoDB for local development.
 *
 * Not everyone has a MongoDB server on their laptop. This script downloads a
 * throw-away mongod binary and runs it on the default port (27017) so that
 * `npm run dev` + `npm run seed` work exactly the same as with a real server.
 *
 *   npm run dev:db     # terminal 1
 *   npm run seed       # terminal 2 (once)
 *   npm run dev        # terminal 2
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const PORT = process.env.MEMO_PORT || '27017';

const server = await MongoMemoryServer.create({
  instance: { port: Number(PORT), ip: '127.0.0.1', dbName: 'meridian' },
});

const uri = server.getUri('meridian');

console.log('\n  ✔ In-memory MongoDB is up');
console.log(`    ${uri}\n`);
console.log('  Press Ctrl+C to stop (data is discarded on exit).\n');

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await server.stop();
    process.exit(0);
  });
}
