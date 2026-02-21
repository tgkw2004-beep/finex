import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

interface SectorStock {
    stock_code: string
    stock_name: string
    revenue: number
    close_price: number
    change_rate: number
    date: string
}

interface SectorData {
    sector_name: string
    sector_code: string
    stocks: SectorStock[]
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await params

        // 1. Get WICS classification for the current symbol
        const mySectorRes = await pool.query(`
            SELECT wics_name1, wics_name2, wics_name3
            FROM remote_visual.vsl_krx_stocks_fundamental_info
            WHERE stock_code = $1
            LIMIT 1
        `, [symbol])

        if (!mySectorRes.rows[0]) {
            return NextResponse.json({ large: null, medium: null, small: null })
        }

        const { wics_name1: largeSector, wics_name2: mediumSector, wics_name3: smallSector } = mySectorRes.rows[0]

        // Define function to fetch stocks for a given sector level/name
        const fetchSectorStocks = async (schemaLevel: string, sectorName: string) => {
            if (!sectorName) return null

            const res = await pool.query(`
                SELECT stock_code, stock_name
                FROM remote_visual.vsl_krx_stocks_fundamental_info
                WHERE ${schemaLevel} = $1
                LIMIT 200
            `, [sectorName])

            const uniqueStocks = new Map<string, string>()
            res.rows.forEach((s: any) => {
                if (!uniqueStocks.has(s.stock_code)) {
                    uniqueStocks.set(s.stock_code, s.stock_name)
                }
            })

            const stockCodes = Array.from(uniqueStocks.keys()).slice(0, 50)
            return { name: sectorName, codes: stockCodes }
        }

        // Fetch concurrently
        const [largeData, mediumData, smallData] = await Promise.all([
            fetchSectorStocks('wics_name1', largeSector),
            fetchSectorStocks('wics_name2', mediumSector),
            fetchSectorStocks('wics_name3', smallSector)
        ])

        // Collect all unique stock codes
        const allCodes = new Set<string>()
        if (largeData) largeData.codes.forEach(c => allCodes.add(c))
        if (mediumData) mediumData.codes.forEach(c => allCodes.add(c))
        if (smallData) smallData.codes.forEach(c => allCodes.add(c))

        const codeArray = Array.from(allCodes)
        if (codeArray.length === 0) {
            return NextResponse.json({ large: null, medium: null, small: null })
        }

        // 2. Fetch Market Cap
        const capRes = await pool.query(`
            SELECT code, cap, date
            FROM remote_company.krx_stocks_cap
            WHERE code = ANY($1)
            ORDER BY date DESC
            LIMIT $2
        `, [codeArray, codeArray.length * 2])

        const capMap = new Map<string, number>()
        capRes.rows.forEach((d: any) => {
            if (!capMap.has(d.code)) {
                capMap.set(d.code, d.cap)
            }
        })

        // 3. Fetch Price Info
        const priceRes = await pool.query(`
            SELECT code, close, date
            FROM remote_company.krx_stocks_ohlcv
            WHERE code = ANY($1)
            ORDER BY date DESC
            LIMIT $2
        `, [codeArray, codeArray.length * 3])

        const pricesByCode = new Map<string, any[]>()
        priceRes.rows.forEach((p: any) => {
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
                if (hist.length > 1) {
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

        // 4. Fetch Names for all codes
        const nameRes = await pool.query(`
            SELECT stock_code, stock_name
            FROM remote_company.master_company_list
            WHERE stock_code = ANY($1)
        `, [codeArray])

        const nameMap = new Map<string, string>()
        nameRes.rows.forEach((n: any) => nameMap.set(n.stock_code, n.stock_name))

        // Helper to format sector data
        const formatStocks = (data: { name: string, codes: string[] } | null): SectorData | null => {
            if (!data) return null

            const stocks = data.codes.map(code => {
                const cap = capMap.get(code) || 0
                const price = priceMap.get(code)
                return {
                    stock_code: code,
                    stock_name: nameMap.get(code) || code,
                    revenue: cap,
                    close_price: price?.close || 0,
                    change_rate: price?.change_rate || 0,
                    date: price?.date || ''
                }
            }).filter(s => s.close_price > 0)
                .sort((a, b) => b.revenue - a.revenue)

            return {
                sector_name: data.name,
                sector_code: data.name,
                stocks: stocks
            }
        }

        return NextResponse.json({
            large: formatStocks(largeData),
            medium: formatStocks(mediumData),
            small: formatStocks(smallData)
        })

    } catch (error: any) {
        console.error('Sector API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
