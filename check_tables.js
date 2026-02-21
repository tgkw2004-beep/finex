
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
    console.log('Attempting to list tables via information_schema...');

    // This usually works if permissions are grantec
    const { data, error } = await supabase
        .from('information_schema.tables') // This might not work via client if not exposed
        .select('table_schema, table_name')
        .eq('table_schema', 'remote_company');

    if (error) {
        console.log('Failed to query information_schema:', error.message);

        // Fallback: Check known tables again with different variations
        const tables = [
            'dart_financial_info',
            'dart_company_info',
            'dart_report',
            'dart_statement',
            'financial_statement',
            'financial_report',
            'company_report',
            'stock_finance',
            'stock_report'
        ];

        for (const table of tables) {
            // console.log(`Checking table: ${table}`);
            const { error: tErr } = await supabase
                .schema('remote_company')
                .from(table)
                .select('*')
                .limit(1);

            if (!tErr) {
                console.log(`Found table: ${table}`);
            }
        }

    } else {
        console.log('Tables in remote_company:', data);
    }
}

listAllTables();
