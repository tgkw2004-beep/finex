import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await context.params

    try {
        // 1. Get Target Company's WICS info
        const targetRes = await pool.query(`
            SELECT stock_code, stock_name, wics_name1, wics_name2, wics_name3
            FROM company.master_company_list
            WHERE stock_code = $1
            LIMIT 1
        `, [symbol])

        const targetCompany = targetRes.rows[0]
        if (!targetCompany) {
            return NextResponse.json({ error: 'Company not found or WICS info missing' }, { status: 404 })
        }

        const { wics_name1, wics_name2, wics_name3 } = targetCompany

        if (!wics_name1) {
            return NextResponse.json({
                target: targetCompany,
                industries: { large: [], medium: [], small: [] }
            })
        }

        // 2. Fetch Peers for the same large sector
        const peersRes = await pool.query(`
            SELECT stock_code, stock_name, wics_name1, wics_name2, wics_name3, revenue
            FROM company.master_company_list
            WHERE wics_name1 = $1
            LIMIT 1000
        `, [wics_name1])

        const peers = peersRes.rows
        const peerCodes = peers.map((p: any) => p.stock_code).filter(Boolean)

        // 3. Get latest available date from OHLCV
        const latestDateRes = await pool.query(`
            SELECT date FROM company.krx_stocks_ohlcv
            ORDER BY date DESC
            LIMIT 1
        `)
        const targetDate = latestDateRes.rows[0]?.date || new Date().toISOString().split('T')[0]

        // 4. Fetch OHLCV for this date and previous date (to calc change_rate)
        let priceMap = new Map()
        if (peerCodes.length > 0) {
            const priceRes = await pool.query(`
                SELECT t.code, t.close,
                       CASE WHEN p.close > 0 
                            THEN ROUND(((t.close - p.close)::numeric / p.close * 100)::numeric, 2)
                            ELSE 0 END AS change_rate
                FROM company.krx_stocks_ohlcv t
                LEFT JOIN company.krx_stocks_ohlcv p
                  ON t.code = p.code
                  AND p.date = (
                      SELECT MAX(date) FROM company.krx_stocks_ohlcv
                      WHERE code = t.code AND date < $1
                  )
                WHERE t.date = $1 AND t.code = ANY($2)
            `, [targetDate, peerCodes])

            priceRes.rows.forEach((p: any) => {
                priceMap.set(p.code, p)
            })
        }

        // 5. Group and Structure Data
        const getPeersForLevel = (levelVal: string, levelKey: 'wics_name1' | 'wics_name2' | 'wics_name3') => {
            if (!levelVal) return []
            return peers
                .filter((p: any) => p[levelKey] === levelVal)
                .map((p: any) => {
                    const price = priceMap.get(p.stock_code)
                    return {
                        stock_code: p.stock_code,
                        stock_name: p.stock_name,
                        revenue: p.revenue || 0,
                        price: price?.close || 0,
                        change_rate: price ? Number(price.change_rate) : 0,
                        wics_name1: p.wics_name1,
                        wics_name2: p.wics_name2,
                        wics_name3: p.wics_name3
                    }
                })
                .sort((a: any, b: any) => b.revenue - a.revenue)
        }

        return NextResponse.json({
            target: {
                ...targetCompany,
                wics: { large: wics_name1, medium: wics_name2, small: wics_name3 }
            },
            industries: {
                large: { name: wics_name1, stocks: getPeersForLevel(wics_name1, 'wics_name1') },
                medium: { name: wics_name2, stocks: getPeersForLevel(wics_name2, 'wics_name2') },
                small: { name: wics_name3, stocks: getPeersForLevel(wics_name3, 'wics_name3') }
            },
            referenceDate: targetDate
        })

    } catch (e: any) {
        console.error('Industry API Error', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
