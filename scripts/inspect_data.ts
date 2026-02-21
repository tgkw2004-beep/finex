import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Simple .env parser
const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8')
const env = envContent.split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=')
    if (key && val) acc[key.trim()] = val.join('=').trim()
    return acc
}, {} as Record<string, string>)

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function inspectData() {
    console.log('--- Inspecting major_stock_holdings (public) ---')
    const { data: holdings, error: holdingsError } = await supabase
        .from('major_stock_holdings')
        .select('*')
        .limit(1)

    if (holdingsError) console.error('Error fetching holdings:', holdingsError)
    else console.log('Sample Holding:', JSON.stringify(holdings[0], null, 2))

    console.log('\n--- Inspecting master_company_list (remote_company) ---')
    const remoteClient = createClient(supabaseUrl, supabaseAnonKey, {
        db: { schema: 'remote_company' },
        global: {
            headers: {
                'Accept-Profile': 'remote_company',
                'Content-Profile': 'remote_company',
            }
        }
    })

    const { data: companies, error: companiesError } = await remoteClient
        .from('master_company_list')
        .select('*')
        .limit(1)

    if (companiesError) console.error('Error fetching companies:', companiesError)
    else console.log('Sample Company:', JSON.stringify(companies[0], null, 2))
}

inspectData()
