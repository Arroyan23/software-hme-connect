import { app } from '../server/app.js';
import { migrate } from '../server/migrate.js';

let migrationPromise;

export default async function handler(req, res) {
  migrationPromise ??= migrate().catch((error) => {
    migrationPromise = undefined;
    throw error;
  });
  await migrationPromise;

  await new Promise((resolve, reject) => {
    res.once('finish', resolve);
    res.once('close', resolve);
    res.once('error', reject);
    try {
      app(req, res);
    } catch (error) {
      reject(error);
    }
  });
}

export { app };
