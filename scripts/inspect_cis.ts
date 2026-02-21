
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log('Inspecting dart_fs_cis for IBK (024110)...')

    const { data, error } = await supabase
        .schema('remote_company')
        .from('dart_fs_cis')
        .select('bsns_year, reprt_code, account_nm, thstrm_amount')
        .eq('code', '024110')
        .limit(20)

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Found rows:', data?.length)
        data?.forEach(row => {
            console.log(`${row.bsns_year} ${row.reprt_code}: ${row.account_nm} = ${row.thstrm_amount}`)
        })
    }
}

main()
