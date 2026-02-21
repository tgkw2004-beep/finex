import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const revalidate = 60

interface StockPrice {
    wics_name: string
    stock_code: string
    stock_name: string
    date: string
    close: number
}

export async function GET() {
    try {
        const today = new Date()
        const endDateStr = today.toISOString().split('T')[0]
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(today.getMonth() - 3)
        const startDateStr = threeMonthsAgo.toISOString().split('T')[0]

        // 1. Get exact Start and End trading days using direct query
        const datesQuery = await pool.query(`
            SELECT 
                (SELECT date FROM visual.vsl_anly_stocks_price_subindex01 WHERE date <= $1 ORDER BY date DESC LIMIT 1) as end_date,
                (SELECT date FROM visual.vsl_anly_stocks_price_subindex01 WHERE date >= $2 ORDER BY date ASC LIMIT 1) as start_date
        `, [endDateStr, startDateStr]);

        const endDate = typeof datesQuery.rows[0]?.end_date === 'string' ? datesQuery.rows[0]?.end_date : datesQuery.rows[0]?.end_date?.toISOString().split('T')[0];
        const startDate = typeof datesQuery.rows[0]?.start_date === 'string' ? datesQuery.rows[0]?.start_date : datesQuery.rows[0]?.start_date?.toISOString().split('T')[0];

        if (!endDate || !startDate) return NextResponse.json([])

        console.log(`Hot Sectors: Analyzing from ${startDate} to ${endDate}`)

        // 2. Fetch prices ONLY for Start and End dates
        const pricesQuery = await pool.query(`
            SELECT wics_name, stock_code, stock_name, date, close 
            FROM visual.vsl_anly_stocks_price_subindex01 
            WHERE date IN ($1, $2)
            ORDER BY date ASC
        `, [startDate, endDate]);

        const prices = pricesQuery.rows.map(r => ({
            ...r,
            date: typeof r.date === 'string' ? r.date : r.date.toISOString().split('T')[0]
        })) as StockPrice[]

        // Group by stock_code
        const stockMap = new Map<string, StockPrice[]>()
        prices.forEach(p => {
            if (!stockMap.has(p.stock_code)) {
                stockMap.set(p.stock_code, [])
            }
            stockMap.get(p.stock_code)?.push(p)
        })

        // Calculate rate per stock
        const validStocks: { wics_name: string, rate: number, param: { code: string, name: string } }[] = []

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
                param: { code: first.stock_code, name: first.stock_name }
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

        // Sort by avgRate desc and take top 5
        const topSectors = results
            .sort((a, b) => b.avgRate - a.avgRate)
            .slice(0, 5)
            .map(s => ({
                name: s.name,
                change: (s.avgRate > 0 ? "+" : "") + s.avgRate.toFixed(2) + "%",
                stocks: s.stockCount,
            }))

        return NextResponse.json(topSectors)

    } catch (err: any) {
        console.error('Hot Sectors API Exception:', err)
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
