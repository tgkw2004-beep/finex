
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log('Checking KIS Info data for IBK (024110)...')

    // Check kis_kospi_info
    const { data: kospiData, error: kospiError } = await supabase
        .schema('remote_company')
        .from('kis_kospi_info')
        .select('*')
        .eq('shortcode', '024110')
        .order('referenceyearmonth', { ascending: false })
        .limit(10)

    if (kospiError) console.error('Error kis_kospi_info:', kospiError)
    else {
        console.log('kis_kospi_info rows:', kospiData?.length)
        kospiData?.forEach(row => {
            console.log(`Date: ${row.referenceyearmonth}, Sales: ${row.sales}, OP: ${row.operatingprofit}, Net: ${row.netincome}`)
        })
    }
}

main()
