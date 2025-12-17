import database from '../config/database';

(async () => {
  try {
    await database.connect();
    await database.runMigrations();
  } catch (err) {
    console.error('Migration run failed:', err);
    process.exit(1);
  } finally {
    try { await database.disconnect(); } catch {}
  }
})();
