
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccountNames() {
    const symbol = '005930';
    console.log(`Checking account names for ${symbol}...`);

    const { data, error } = await supabase
        .schema('remote_company')
        .from('dart_fs_is')
        .select('account_nm')
        .eq('code', symbol)
        .limit(100);

    if (error) {
        console.error('Error:', error);
    } else {
        // Filter for revenue/profit related
        const accounts = [...new Set(data.map(r => r.account_nm))];
        const revenueAccounts = accounts.filter(n => n.includes('매출') || n.includes('수익'));
        const profitAccounts = accounts.filter(n => n.includes('이익'));

        console.log('Revenue Related:', revenueAccounts);
        console.log('Profit Related:', profitAccounts);
    }
}

checkAccountNames();
