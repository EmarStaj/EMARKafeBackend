const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT proname, prosrc 
    FROM pg_proc 
    WHERE proname = 'deduct_balance' OR proname = 'refund_balance';
  `);
  console.log(res.rows);
  await client.end();
}
run();
