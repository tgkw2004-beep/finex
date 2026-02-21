import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

interface StockPrice {
    wics_name: string
    stock_code: string
    stock_name: string
    date: string
    close: number
}

// Find a valid trading day near the target date
async function getTradingDay(targetStr: string, direction: 'back' | 'forward' | 'both' = 'back') {
    const target = new Date(targetStr)
    for (let i = 0; i < 15; i++) {
        if (direction === 'back' || direction === 'both') {
            const dStr = new Date(target.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            const res = await pool.query('SELECT date FROM visual.vsl_anly_stocks_price_subindex01 WHERE date = $1 LIMIT 1', [dStr])
            if (res.rows.length > 0) return dStr
        }
        if (i > 0 && (direction === 'forward' || direction === 'both')) {
            const dStr = new Date(target.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            const res = await pool.query('SELECT date FROM visual.vsl_anly_stocks_price_subindex01 WHERE date = $1 LIMIT 1', [dStr])
            if (res.rows.length > 0) return dStr
        }
    }
    return null
}

export async function GET() {
    try {
        const today = new Date()
        const endDateStr = today.toISOString().split('T')[0]
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(today.getMonth() - 3)
        const startDateStr = threeMonthsAgo.toISOString().split('T')[0]

        // 1. Get exact Start and End trading days using point queries to avoid timeouts
        const endDate = await getTradingDay(endDateStr, 'back')
        if (!endDate) return NextResponse.json([])

        const startDate = await getTradingDay(startDateStr, 'forward')
        if (!startDate) return NextResponse.json([])

        // 2. Fetch prices ONLY for Start and End dates concurrently to avoid timeouts
        const [startRes, endRes] = await Promise.all([
            pool.query(`
                SELECT wics_name, stock_code, stock_name, date, close 
                FROM visual.vsl_anly_stocks_price_subindex01 
                WHERE date = $1
            `, [startDate]),
            pool.query(`
                SELECT wics_name, stock_code, stock_name, date, close 
                FROM visual.vsl_anly_stocks_price_subindex01 
                WHERE date = $1
            `, [endDate])
        ])

        const rawData = [...(startRes.rows || []), ...(endRes.rows || [])]

        const formatDate = (d: any) => {
            if (!d) return '';
            if (typeof d === 'string') return d.split('T')[0];
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const prices: StockPrice[] = rawData.map((p: any) => ({
            ...p,
            date: formatDate(p.date),
            close: parseFloat(p.close)
        }))

        // Group by stock_code
        const stockMap = new Map<string, StockPrice[]>()
        prices.forEach(p => {
            if (!stockMap.has(p.stock_code)) {
                stockMap.set(p.stock_code, [])
            }
            stockMap.get(p.stock_code)?.push(p)
        })

        // Calculate rate per stock
        const validStocks: { wics_name: string, rate: number }[] = []

        for (const [code, stockPrices] of stockMap.entries()) {
            if (stockPrices.length < 2) continue

            const sorted = stockPrices.sort((a, b) => a.date.localeCompare(b.date))
            const first = sorted[0]
            const last = sorted[sorted.length - 1]

            if (first.close === 0) continue

            const rate = ((last.close / first.close) - 1) * 100

            validStocks.push({
                wics_name: first.wics_name,
                rate,
            })
        }

        // Group by sector (wics_name)
        const sectorMap = new Map<string, { totalRate: number, count: number }>()

        validStocks.forEach(s => {
            if (!s.wics_name) return

            if (!sectorMap.has(s.wics_name)) {
                sectorMap.set(s.wics_name, { totalRate: 0, count: 0 })
            }

            const sector = sectorMap.get(s.wics_name)!
            sector.totalRate += s.rate
            sector.count += 1
        })

        // Calculate average rate
        const results = Array.from(sectorMap.entries()).map(([name, data]) => ({
            name,
            avgRate: data.totalRate / data.count,
            stockCount: data.count
        }))

        // Sort by avgRate desc
        const allSectors = results
            .sort((a, b) => b.avgRate - a.avgRate)
            .map(s => ({
                name: s.name,
                change: (s.avgRate > 0 ? "+" : "") + s.avgRate.toFixed(2) + "%",
                changeRaw: s.avgRate,
                stocks: s.stockCount,
            }))

        return NextResponse.json(allSectors)

    } catch (err: any) {
        console.error('All Sectors API Exception:', err)
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
