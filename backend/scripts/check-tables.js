const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:sound2003@localhost:5432/iso_qms';

(async () => {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log(res.rows.map((row) => row.table_name).join('\n'));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
