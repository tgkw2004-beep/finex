
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const symbol = '005930';
    console.log(`Checking data for ${symbol}...`);

    // 2. Check krx_stocks_fundamental_info
    const { data: fundamental, error: fundError } = await supabase
        .schema('remote_company')
        .from('krx_stocks_fundamental_info')
        .select('*')
        .eq('code', symbol)
        .order('date', { ascending: false })
        .limit(1);

    if (fundError) console.error('Fundamental Error:', fundError);
    console.log('Fundamental Info:', fundamental ? fundamental[0] : 'None');
}

checkData();
