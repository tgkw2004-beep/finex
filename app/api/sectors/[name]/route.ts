import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getTradingDay(schema: string, table: string, targetStr: string, direction: 'back' | 'forward' | 'both' = 'back') {
    const target = new Date(targetStr)
    for (let i = 0; i < 15; i++) {
        if (direction === 'back' || direction === 'both') {
            const dStr = new Date(target.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            const res = await pool.query(`SELECT date FROM ${schema}.${table} WHERE date = $1 LIMIT 1`, [dStr])
            if (res.rows.length > 0) return dStr
        }
        if (i > 0 && (direction === 'forward' || direction === 'both')) {
            const dStr = new Date(target.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            const res = await pool.query(`SELECT date FROM ${schema}.${table} WHERE date = $1 LIMIT 1`, [dStr])
            if (res.rows.length > 0) return dStr
        }
    }
    return null
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params
        const decodedName = decodeURIComponent(name)

        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(today.getMonth() - 1)
        const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0]

        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(today.getMonth() - 3)
        const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0]

        // Find precise trading days using point queries early on
        const capEndDate = await getTradingDay('company', 'krx_stocks_cap', todayStr, 'back')
        const capStartDate = await getTradingDay('company', 'krx_stocks_cap', oneMonthAgoStr, 'forward')

        const priceEndDate = await getTradingDay('visual', 'vsl_anly_stocks_price_subindex01', todayStr, 'back')
        const priceStartDate = await getTradingDay('visual', 'vsl_anly_stocks_price_subindex01', threeMonthsAgoStr, 'forward')

        // 1. Get distinct stocks for the sector (using a specific date to prevent full table scan timeouts)
        const wicsRes = await pool.query(`
            SELECT stock_code, wics_name, stock_name 
            FROM visual.vsl_anly_stocks_price_subindex01 
            WHERE wics_name = $1 AND date = $2
        `, [decodedName, priceEndDate || todayStr])

        const wicsInfoData = wicsRes.rows

        if (!wicsInfoData || wicsInfoData.length === 0) return NextResponse.json([])

        // Deduplicate
        const wicsInfoMap = new Map<string, { stock_name: string, wics_name: string }>()
        wicsInfoData.forEach(item => {
            if (!wicsInfoMap.has(item.stock_code)) {
                wicsInfoMap.set(item.stock_code, { stock_name: item.stock_name, wics_name: item.wics_name })
            }
        })
        const stockCodes = Array.from(wicsInfoMap.keys())

        // Chunking the IN queries
        const CHUNK_SIZE = 200
        let capData: any[] = []
        let priceData: any[] = []

        for (let i = 0; i < stockCodes.length; i += CHUNK_SIZE) {
            const chunk = stockCodes.slice(i, i + CHUNK_SIZE)

            if (capStartDate && capEndDate) {
                const dates = capStartDate === capEndDate ? [capStartDate] : [capStartDate, capEndDate]
                try {
                    const capChunkRes = await pool.query(`
                        SELECT code, date, cap 
                        FROM company.krx_stocks_cap 
                        WHERE code = ANY($1) AND date = ANY($2)
                    `, [chunk, dates])
                    capData = capData.concat(capChunkRes.rows)
                } catch (capErr: any) {
                    console.warn(`Cap fetch error: ${capErr.message}`)
                }
            }

            if (priceStartDate && priceEndDate) {
                const dates = priceStartDate === priceEndDate ? [priceStartDate] : [priceStartDate, priceEndDate]
                try {
                    const priceChunkRes = await pool.query(`
                        SELECT stock_code, date, close 
                        FROM visual.vsl_anly_stocks_price_subindex01 
                        WHERE stock_code = ANY($1) AND date = ANY($2)
                    `, [chunk, dates])
                    priceData = priceData.concat(priceChunkRes.rows)
                } catch (priceErr: any) {
                    console.warn(`Price fetch error: ${priceErr.message}`)
                }
            }
        }

        const capMap = new Map<string, { cap_1m_ago: number, cap_now: number, date_now: string }>()

        const formatDate = (d: any) => {
            if (!d) return '';
            if (typeof d === 'string') return d.split('T')[0];
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        capData.forEach(d => {
            if (!capMap.has(d.code)) capMap.set(d.code, { cap_1m_ago: 0, cap_now: 0, date_now: '' })
            const entry = capMap.get(d.code)!
            const dateStr = formatDate(d.date)
            const capVal = parseFloat(d.cap)
            if (dateStr === capStartDate) entry.cap_1m_ago = capVal
            if (dateStr === capEndDate) {
                entry.cap_now = capVal
                entry.date_now = dateStr
            }
        })

        const priceMap = new Map<string, { price_3m_ago: number, price_now: number }>()
        priceData.forEach(d => {
            if (!priceMap.has(d.stock_code)) priceMap.set(d.stock_code, { price_3m_ago: 0, price_now: 0 })
            const entry = priceMap.get(d.stock_code)!
            const dateStr = formatDate(d.date)
            const closeVal = parseFloat(d.close)
            if (dateStr === priceStartDate) entry.price_3m_ago = closeVal
            if (dateStr === priceEndDate) entry.price_now = closeVal
        })

        const results: any[] = []

        stockCodes.forEach(code => {
            const c = capMap.get(code)
            const p = priceMap.get(code)
            const w = wicsInfoMap.get(code)

            if (c && c.cap_1m_ago > 0 && c.cap_now > 0 && w) {
                const cap_rate = Number((((c.cap_now / c.cap_1m_ago) - 1) * 100).toFixed(2))
                let price_rate_3m = null
                if (p && p.price_3m_ago > 0 && p.price_now > 0) {
                    price_rate_3m = Number((((p.price_now / p.price_3m_ago) - 1) * 100).toFixed(2))
                }

                // formatting cap_now
                let cap_formatted = ''
                const cap_now = c.cap_now
                if (cap_now >= 1000000000000) {
                    const jo = Math.floor(cap_now / 1000000000000)
                    const uk = Math.floor((cap_now % 1000000000000) / 100000000)
                    cap_formatted = `${jo.toLocaleString()}조 ${uk > 0 ? uk.toLocaleString() + '억' : ''}`.trim()
                } else if (cap_now >= 100000000) {
                    const uk = Math.floor(cap_now / 100000000)
                    cap_formatted = `${uk.toLocaleString()}억`
                } else {
                    cap_formatted = cap_now.toLocaleString()
                }

                results.push({
                    "일자": c.date_now,
                    "종목명": w.stock_name,
                    "종목코드": code,
                    "최근 시총(원)": cap_formatted,
                    "1개월 시총 상승률": cap_rate,
                    "3개월 등락률": price_rate_3m,
                    "세부정보": "차트보기"
                })
            }
        })

        results.sort((a, b) => b["1개월 시총 상승률"] - a["1개월 시총 상승률"])

        return NextResponse.json(results)

    } catch (err: any) {
        console.error('Sector details API Exception:', err)
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
