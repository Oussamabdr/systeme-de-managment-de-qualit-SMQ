const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:sound2003@localhost:5432/iso_qms';

(async () => {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='Process' ORDER BY ordinal_position");
    console.log(res.rows.map((row) => row.column_name).join('\n'));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
