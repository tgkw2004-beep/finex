import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await context.params
    // console.log(`[IndustryAPI] Fetching for symbol: ${symbol}`)
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') // Optional: specific date for price/revenue?

    // Initialize Supabase Clients directly
    const publicSupabase = createClient(supabaseUrl, supabaseAnonKey)

    // For remote_company, we need customized headers AND schema config
    const remoteCompany = createClient(supabaseUrl, supabaseAnonKey, {
        db: {
            schema: 'remote_company'
        },
        global: {
            headers: {
                'Accept-Profile': 'remote_company',
                'Content-Profile': 'remote_company',
            }
        }
    })

    try {
        // 1. Get Target Company's WICS info
        const { data: targetCompany, error: targetError } = await remoteCompany
            .from('master_company_list')
            .select('stock_code, stock_name, wics_name1, wics_name2, wics_name3')
            .eq('stock_code', symbol)
            .single()

        if (targetError || !targetCompany) {
            console.error("[IndustryAPI] Target fetching error", targetError)
            return NextResponse.json({ error: 'Company not found or WICS info missing' }, { status: 404 })
        }

        const { wics_name1, wics_name2, wics_name3 } = targetCompany

        // 2. Fetch Peers for each Level
        // Error handling: if wics_name1 is null? 
        if (!wics_name1) {
            return NextResponse.json({
                target: targetCompany,
                industries: { large: [], medium: [], small: [] }
            })
        }

        const { data: peers, error: peersError } = await remoteCompany
            .from('master_company_list')
            .select('stock_code, stock_name, wics_name1, wics_name2, wics_name3, revenue')
            .eq('wics_name1', wics_name1)
            .limit(1000) // Increased limit to fetch all relevant peers (User Request)

        if (peersError) {
            throw peersError
        }

        // 3. Fetch Price Data (Fluctuation) for these peers
        // We need the latest price change for ALL these peers.
        // List of stock codes
        const peerCodes = peers.map(p => p.stock_code)

        // Calculate latest business day (approximate or use current date)
        const today = new Date()

        // Get latest available date from OHLCV first? 
        const { data: latestDateData } = await publicSupabase
            .from('krx_stocks_ohlcv')
            .select('date')
            .order('date', { ascending: false })
            .limit(1)
            .single()

        const targetDate = latestDateData?.date || today.toISOString().split('T')[0]

        // Fetch OHLCV for this date
        const { data: priceData, error: priceError } = await publicSupabase
            .from('krx_stocks_ohlcv')
            .select('stock_code, close, change_rate') // change_rate is usually %
            .eq('date', targetDate)
            .in('stock_code', peerCodes)

        // Create Map for fast lookup
        const priceMap = new Map()
        if (priceData) {
            priceData.forEach(p => {
                priceMap.set(p.stock_code, p)
            })
        }

        // 4. Group and Structure Data
        const getPeersForLevel = (levelVal: string, levelKey: 'wics_name1' | 'wics_name2' | 'wics_name3') => {
            if (!levelVal) return []
            return peers
                .filter(p => p[levelKey] === levelVal)
                .map(p => {
                    const price = priceMap.get(p.stock_code)
                    return {
                        stock_code: p.stock_code,
                        stock_name: p.stock_name || p.stock_name,
                        revenue: p.revenue || 0,
                        price: price?.close || 0,
                        change_rate: price?.change_rate || 0,
                        wics_name1: p.wics_name1,
                        wics_name2: p.wics_name2,
                        wics_name3: p.wics_name3
                    }
                })
                .sort((a, b) => b.revenue - a.revenue) // Sort by revenue desc
        }

        const largePeers = getPeersForLevel(wics_name1, 'wics_name1')
        const midPeers = getPeersForLevel(wics_name2, 'wics_name2')
        const smallPeers = getPeersForLevel(wics_name3, 'wics_name3')

        return NextResponse.json({
            target: {
                ...targetCompany,
                wics: { large: wics_name1, medium: wics_name2, small: wics_name3 }
            },
            industries: {
                large: { name: wics_name1, stocks: largePeers },
                medium: { name: wics_name2, stocks: midPeers },
                small: { name: wics_name3, stocks: smallPeers }
            },
            referenceDate: targetDate
        })

    } catch (e: any) {
        console.error("Industry API Error", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
