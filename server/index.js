import { app } from './app.js';
import { migrate } from './migrate.js';
import { pool } from './db.js';

await migrate();
const server=app.listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1', () => console.log(`HME API: http://localhost:${process.env.PORT || 3001}`));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => { server.close(async () => { await pool.end(); process.exit(0); }); });
