
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log('Listing tables in remote_company schema...')

    // We can't query information_schema easily via client directly usually unless exposed.
    // But we can try an RPC if one exists, OR just try to query likely table names.
    // Actually, asking PostgREST for the schema definition is possible if enabled.
    // But let's try to query a few likely candidates.

    const tables = ['dart_fs_is', 'dart_fs_bs', 'dart_fs_cf', 'dart_fs_cis', 'dart_fs_fnl', 'dart_fnl_tt']

    for (const table of tables) {
        const { data, error } = await supabase
            .schema('remote_company')
            .from(table)
            .select('code')
            .eq('code', '024110')
            .limit(1)

        if (error) {
            console.log(`Table ${table}: Error or not found (${error.message})`)
        } else {
            console.log(`Table ${table}: Found ${data.length} rows for 024110`)
        }
    }
}

main()
