const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://pgsadmin:pg1234@118.219.232.158:15432/atoz' });
async function run() {
    const r = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('market', 'visual', 'public', 'company') ORDER BY table_schema, table_name");
    r.rows.forEach(row => console.log(`${row.table_schema}.${row.table_name}`));
    process.exit(0);
}
run();
