
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log('Checking IBK data...')

    // Check dart_fs_is
    const { data: isData, error: isError } = await supabase
        .schema('remote_company')
        .from('dart_fs_is')
        .select('*')
        .eq('code', '024110')
        .limit(5)

    if (isError) console.error('Error dart_fs_is:', isError)
    else console.log('dart_fs_is rows:', isData?.length, isData)


    // Check if there are other tables? 
    // We can't easily list tables with client, but we can try other likely names if known.
    // Use rpc if available? or just query known tables.
}

main()
