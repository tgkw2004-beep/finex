const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://pgsadmin:pg1234@118.219.232.158:15432/atoz' });
async function run() {
    const r = await pool.query("SELECT DISTINCT item_name1 FROM market.ecos_currency_all");
    console.log(r.rows);
    process.exit(0);
}
run();
