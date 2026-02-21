const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://pgsadmin:pg1234@118.219.232.158:15432/atoz' });
async function run() {
    const r = await pool.query("SELECT date, item_name1, data_value FROM market.ecos_currency_all LIMIT 5");
    console.log(r.rows);
    process.exit(0);
}
run();
