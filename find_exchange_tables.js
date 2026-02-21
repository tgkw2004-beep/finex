const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkSchema(schema) {
    const supabase = createClient(supabaseUrl, supabaseKey, { db: { schema } });
    const { data, error } = await supabase.rpc('get_tables_in_schema', { schema_name: schema });
    
    if (error) {
        console.log(`Error or RPC not found for ${schema}. Trying fallback...`);
        // Fallback: try querying common table names if RPC doesn't exist.
        // But since we can't easily list tables without RPC via REST, we might just query information_schema.
    } else {
        console.log(`Tables in ${schema}:`, data);
    }
}
checkSchema('remote_visual');
checkSchema('remote_company');
