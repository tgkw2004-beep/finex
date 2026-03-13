import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const getLatest = searchParams.get('latest')

        // Get latest available date across all three tables (KST 기준)
        if (getLatest === 'true') {
            const res = await pool.query(`
                SELECT MAX(kst_date)::text AS date FROM (
                    SELECT MAX(date AT TIME ZONE 'Asia/Seoul')::date AS kst_date FROM company.kis_closing_price_sale
                    UNION ALL
                    SELECT MAX(date AT TIME ZONE 'Asia/Seoul')::date AS kst_date FROM company.kis_closing_price_sale2
                    UNION ALL
                    SELECT MAX(date AT TIME ZONE 'Asia/Seoul')::date AS kst_date FROM company.kis_closing_price_sale3
                ) t
            `)

            return NextResponse.json({ latestDate: res.rows[0]?.date || null })
        }

        // Stats mode for calendar counts
        const getStats = searchParams.get('stats')
        if (getStats === 'true') {
            const res = await pool.query(`
                SELECT to_char(date, 'yyyy-MM-dd') as date
                     , count(*) as count
                FROM (
                    SELECT date, stock_code FROM company.kis_closing_price_sale
                    UNION ALL
                    SELECT date, stock_code FROM company.kis_closing_price_sale2
                    UNION ALL
                    SELECT date, stock_code FROM company.kis_closing_price_sale3
                ) t
                GROUP BY date
                ORDER BY date DESC
            `)
            
            const statsMap = res.rows.reduce((acc: any, row: any) => {
                acc[row.date] = parseInt(row.count)
                return acc
            }, {})

            return NextResponse.json({ stats: statsMap })
        }

        if (!date) {
            return NextResponse.json(
                { error: 'Date parameter is required' },
                { status: 400 }
            )
        }

        // Fetch data from all three tables
        const [table1Result, table2Result, table3Result] = await Promise.all([
            pool.query(`
                SELECT * FROM company.kis_closing_price_sale 
                WHERE date = $1 
                ORDER BY stock_code
            `, [date]),
            pool.query(`
                SELECT * FROM company.kis_closing_price_sale2 
                WHERE date = $1 
                ORDER BY stock_code
            `, [date]),
            pool.query(`
                SELECT * FROM company.kis_closing_price_sale3 
                WHERE date = $1 
                ORDER BY stock_code
            `, [date])
        ])

        return NextResponse.json({
            table1: table1Result.rows || [],
            table2: table2Result.rows || [],
            table3: table3Result.rows || [],
            hasData: {
                table1: (table1Result.rows?.length || 0) > 0,
                table2: (table2Result.rows?.length || 0) > 0,
                table3: (table3Result.rows?.length || 0) > 0,
            }
        })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
