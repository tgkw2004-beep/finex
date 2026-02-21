import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const targetCurrencies = ['원/미국달러(매매기준율)', '원/일본엔(100엔)', '원/유로', '원/위안(매매기준율)']

        // 1. Fetch dates directly via pool
        const dateQuery = await pool.query(`
            SELECT date 
            FROM market.ecos_currency_all 
            WHERE item_name1 = '원/미국달러(매매기준율)' 
            ORDER BY date DESC 
            LIMIT 2000
        `);

        if (dateQuery.rowCount === 0) {
            return NextResponse.json({ error: 'No recent currency data found' }, { status: 404 })
        }

        // Force safe string conversion for the dates we fetched
        // PostgreSQL can return dates as strings or JS Dates depending on pg version/types
        const formatDate = (d: any) => {
            if (!d) return '';
            if (typeof d === 'string') return d.split('T')[0];

            // Format JS Date to YYYY-MM-DD safely
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const allDates = dateQuery.rows.map(d => formatDate(d.date)).filter(Boolean);
        const latestDateStr = allDates[0]
        const latestDate = new Date(latestDateStr)

        const getClosestDate = (targetDate: Date) => {
            const targetStr = formatDate(targetDate)
            return allDates.find(d => d <= targetStr) || null
        }

        const d1w = new Date(latestDate); d1w.setDate(d1w.getDate() - 7)
        const d1m = new Date(latestDate); d1m.setMonth(d1m.getMonth() - 1)
        const d6m = new Date(latestDate); d6m.setMonth(d6m.getMonth() - 6)
        const d1y = new Date(latestDate); d1y.setFullYear(d1y.getFullYear() - 1)
        const d5y = new Date(latestDate); d5y.setFullYear(d5y.getFullYear() - 5)

        const datesToFetch = [
            latestDateStr, // Now
            allDates[1] || null, // Today (Prev day)
            getClosestDate(d1w), // 1W
            getClosestDate(d1m), // 1M
            getClosestDate(d6m), // 6M
            getClosestDate(d1y), // 1Y
            getClosestDate(d5y)  // 5Y
        ].filter(Boolean) as string[]

        // Remove duplicates and guarantee strings
        const uniqueDatesStrings = Array.from(new Set(datesToFetch)).map(formatDate)

        const ratesQuery = await pool.query(`
            SELECT date, item_name1, data_value 
            FROM market.ecos_currency_all 
            WHERE item_name1 = ANY($1) 
              AND date = ANY($2)
        `, [targetCurrencies, uniqueDatesStrings]);

        const rates = ratesQuery.rows.map(r => ({
            ...r,
            data_value: parseFloat(r.data_value),
            date: formatDate(r.date)
        }));

        // Group the Logic
        const results: any = {}
        const mapping: Record<string, string> = {
            '원/미국달러(매매기준율)': 'USD',
            '원/일본엔(100엔)': 'JPY',
            '원/유로': 'EUR',
            '원/위안(매매기준율)': 'CNY'
        }

        targetCurrencies.forEach(currencyName => {
            const code = mapping[currencyName]
            const curData = rates?.filter((r: { item_name1: string, date: string, data_value: number }) => r.item_name1 === currencyName) || []

            const getValueByDate = (d: string | null) => {
                if (!d) return null
                // Allow matching regardless of time piece
                const found = curData.find((r: { date: string, data_value: number }) => r.date.startsWith(d))
                return found?.data_value || null
            }

            const calculatePercent = (nowVal: number, oldVal: number | null | undefined) => {
                if (!oldVal) return null
                return Number((((nowVal / oldVal) - 1) * 100).toFixed(2))
            }
            const calculateAbs = (nowVal: number, oldVal: number | null | undefined) => {
                if (!oldVal) return null
                return Number((nowVal - oldVal).toFixed(2))
            }

            const latestVal = getValueByDate(latestDateStr)
            if (latestVal) {
                const prevDateStr = allDates[1] || null
                const prevVal = getValueByDate(prevDateStr)

                results[code] = {
                    name: currencyName,
                    value: latestVal,
                    date: latestDateStr,
                    todayAbs: calculateAbs(latestVal, prevVal),
                    todayPct: calculatePercent(latestVal, prevVal),
                    weekPct: calculatePercent(latestVal, getValueByDate(getClosestDate(d1w))),
                    monthPct: calculatePercent(latestVal, getValueByDate(getClosestDate(d1m))),
                    sixMonthPct: calculatePercent(latestVal, getValueByDate(getClosestDate(d6m))),
                    yearPct: calculatePercent(latestVal, getValueByDate(getClosestDate(d1y))),
                    fiveYearPct: calculatePercent(latestVal, getValueByDate(getClosestDate(d5y)))
                }
            }
        })

        return NextResponse.json(results)

    } catch (error) {
        console.error('Exchange Rates API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 })
    }
}
