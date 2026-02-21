const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://pgsadmin:pg1234@118.219.232.158:15432/atoz' });
async function run() {
    try {
        const r = await pool.query("SELECT * FROM public.major_stock_holdings LIMIT 1");
        console.log("Found:", r.rowCount);
    } catch(e) {
        console.log("Error:", e.message);
        try {
            const r2 = await pool.query("SELECT * FROM company.major_stock_holdings LIMIT 1");
            console.log("Found in company:", r2.rowCount);
        } catch(e2) {
            console.log("Error in company:", e2.message);
        }
    }
    process.exit(0);
}
run();
