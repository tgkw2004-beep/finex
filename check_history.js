
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHistoricalData() {
    const symbol = '005930';
    console.log(`Checking historical data for ${symbol}...`);

    // Check kis_kospi_info for multiple rows
    const { data: kospi, error: kospiError } = await supabase
        .schema('remote_company')
        .from('kis_kospi_info')
        .select('referenceyearmonth, sales, operatingprofit, netincome, roe')
        .eq('shortcode', symbol)
        .order('referenceyearmonth', { ascending: false })
        .limit(10);

    if (kospiError) console.error('Kospi Error:', kospiError);
    console.log('Kospi History:', kospi);
}

checkHistoricalData();
