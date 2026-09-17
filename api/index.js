import { app } from '../server/app.js';
import { migrate } from '../server/migrate.js';

let migrationPromise;

export default async function handler(req, res) {
  migrationPromise ??= migrate().catch((error) => {
    migrationPromise = undefined;
    throw error;
  });
  await migrationPromise;
  return app(req, res);
}

export { app };
