
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDartCompanyInfo() {
    console.log('Checking dart_company_info schema...');

    const symbol = '005930';

    // Check valid columns in dart_company_info
    const { data, error } = await supabase
        .schema('remote_company')
        .from('dart_company_info')
        .select('*')
        .eq('stock_code', symbol) // Guessing column name
        .limit(1);

    if (error) {
        console.log(`Error querying dart_company_info: ${error.message}`);
        // Try without filter to see columns
        const { data: sample, error: sampleError } = await supabase
            .schema('remote_company')
            .from('dart_company_info')
            .select('*')
            .limit(1);

        if (sampleError) console.log(`Error querying sample: ${sampleError.message}`);
        else console.log('Sample Data:', sample ? sample[0] : 'None');

    } else {
        console.log('Dart Company Info Data:', data);
    }
}

checkDartCompanyInfo();
