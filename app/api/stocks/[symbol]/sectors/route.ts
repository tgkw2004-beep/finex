import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Interfaces for response data
interface SectorStock {
    stock_code: string
    stock_name: string
    revenue: number // Using Market Cap as proxy for size in heatmap if revenue is not available, or Sales
    close_price: number
    change_rate: number
    date: string
}

interface SectorData {
    sector_name: string
    sector_code: string // Just utilizing the name as code for WICS
    stocks: SectorStock[]
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> } // params is a Promise
) {
    try {
        const { symbol } = await params

        // Standard client without default schema
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: { persistSession: false }
            }
        )

        // 1. Get WICS classification for the current symbol
        const { data: mySector, error: sectorError } = await supabase
            .schema('remote_visual')
            .from('vsl_krx_stocks_fundamental_info')
            .select('wics_name1, wics_name2, wics_name3')
            .eq('stock_code', symbol)
            // .order('date', { ascending: false }) // Try without order first, or with
            .limit(1)
            .maybeSingle()

        if (sectorError || !mySector) {
            console.error('Sector not found or error:', sectorError)
            return NextResponse.json({ large: null, medium: null, small: null })
        }

        const { wics_name1: largeSector, wics_name2: mediumSector, wics_name3: smallSector } = mySector

        // Define function to fetch stocks for a given sector level/name
        const fetchSectorStocks = async (schemaLevel: string, sectorName: string) => {
            if (!sectorName) return null;

            // Find stocks in this sector
            const { data: stocks, error } = await supabase
                .schema('remote_visual')
                .from('vsl_krx_stocks_fundamental_info')
                .select('stock_code, stock_name')
                .eq(schemaLevel, sectorName)
                .limit(200)

            if (error) {
                console.error(`Error fetching stocks for ${schemaLevel}: `, error)
                return null
            }

            // Deduplicate stocks
            const uniqueStocks = new Map<string, string>()
            stocks?.forEach((s: any) => {
                if (!uniqueStocks.has(s.stock_code)) {
                    uniqueStocks.set(s.stock_code, s.stock_name)
                }
            })

            // Limit to top 50 to avoid heavy processing
            const stockCodes = Array.from(uniqueStocks.keys()).slice(0, 50)

            return { name: sectorName, codes: stockCodes }
        }

        // Fetch concurrently
        const [largeData, mediumData, smallData] = await Promise.all([
            fetchSectorStocks('wics_name1', largeSector),
            fetchSectorStocks('wics_name2', mediumSector),
            fetchSectorStocks('wics_name3', smallSector)
        ])

        // Collect all unique stock codes to fetch Price & Market Cap/Revenue
        const allCodes = new Set<string>()
        if (largeData) largeData.codes.forEach(c => allCodes.add(c))
        if (mediumData) mediumData.codes.forEach(c => allCodes.add(c))
        if (smallData) smallData.codes.forEach(c => allCodes.add(c))

        const codeArray = Array.from(allCodes)

        if (codeArray.length === 0) {
            return NextResponse.json({ large: null, medium: null, small: null })
        }

        // 2. Fetch Market Cap (Proxy for Size)
        const { data: capData } = await supabase
            .schema('remote_company')
            .from('krx_stocks_cap')
            .select('code, cap, date')
            .in('code', codeArray)
            .order('date', { ascending: false })
            .limit(codeArray.length * 2) // Get enough for recent date

        const capMap = new Map<string, number>()
        capData?.forEach((d: any) => {
            if (!capMap.has(d.code)) {
                capMap.set(d.code, d.cap)
            }
        })

        // 3. Fetch Price Info (Change Rate)
        const { data: priceData } = await supabase
            .schema('remote_company')
            .from('krx_stocks_ohlcv')
            .select('code, close, date')
            .in('code', codeArray)
            .order('date', { ascending: false })
            .limit(codeArray.length * 3)
        // ... (Price processing code omitted for brevity as it doesn't need change, but I need to include context to match block)


        const pricesByCode = new Map<string, any[]>()
        priceData?.forEach((p: any) => {
            if (!pricesByCode.has(p.code)) {
                pricesByCode.set(p.code, [])
            }
            pricesByCode.get(p.code)?.push(p)
        })

        const priceMap = new Map<string, { close: number, change_rate: number, date: string }>()
        codeArray.forEach(code => {
            const hist = pricesByCode.get(code)
            if (hist && hist.length > 0) {
                const today = hist[0]
                let change_rate = 0
                if (today.fluc_rt !== undefined) {
                    change_rate = Number(today.fluc_rt)
                } else if (hist.length > 1) {
                    const yesterday = hist[1]
                    if (yesterday.close > 0) {
                        change_rate = ((today.close - yesterday.close) / yesterday.close) * 100
                    }
                }
                priceMap.set(code, {
                    close: Number(today.close),
                    change_rate: Number(change_rate.toFixed(2)),
                    date: today.date
                })
            }
        })

        // Helper to format stock data
        const formatStocks = (data: { name: string, codes: string[] } | null): SectorData | null => {
            if (!data) return null;

            const stocks = data.codes.map(code => {
                const cap = capMap.get(code) || 0
                const price = priceMap.get(code)
                // Use Name from largeData/mediumData is tricky as we just have codes.
                // We can query master_company_list, OR just use name from initial fetch
                // Initial fetch had stock_name.
                // Let's re-use the stock_name from the `fetchSectorStocks` step?
                // Actually `fetchSectorStocks` returned codes, let's check...
                // Only codes. Re-fetching names might be cleaner or passing a map.
                // Optimization: `fetchSectorStocks` can return Map<code, name>

                return {
                    stock_code: code,
                    // We need a name map. Let's assume we can get it or just use code if missing.
                    // For now, let's fetch names in batch if needed or assume we can get it.
                    // Actually, let's execute a quick name fetch for all codes to be safe.
                    stock_name: code,
                    revenue: cap, // Using Market Cap as 'value' for Treemap
                    close_price: price?.close || 0,
                    change_rate: price?.change_rate || 0,
                    date: price?.date || ''
                }
            }).filter(s => s.close_price > 0) // Filter out valid prices
                .sort((a, b) => b.revenue - a.revenue) // Sort by Size

            return {
                sector_name: data.name,
                sector_code: data.name,
                stocks: stocks
            }
        }

        // 4. Fetch Names for all codes (Batch)
        // 4. Fetch Names for all codes (Batch)
        const { data: nameData } = await supabase
            .schema('remote_company')
            .from('master_company_list')
            .select('stock_code, stock_name')
            .in('stock_code', codeArray)

        const nameMap = new Map<string, string>()
        nameData?.forEach((n: any) => nameMap.set(n.stock_code, n.stock_name))

        const enrichStocks = (sector: SectorData | null) => {
            if (!sector) return null;
            sector.stocks = sector.stocks.map(s => ({
                ...s,
                stock_name: nameMap.get(s.stock_code) || s.stock_name
            }))
            return sector
        }

        return NextResponse.json({
            large: enrichStocks(formatStocks(largeData)),
            medium: enrichStocks(formatStocks(mediumData)),
            small: enrichStocks(formatStocks(smallData))
        })

    } catch (error: any) {
        console.error('Sector API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
