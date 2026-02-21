import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const revalidate = 60

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const getLatest = searchParams.get('latest')

        // Get latest available date
        if (getLatest === 'true') {
            const res = await pool.query(`
                SELECT date 
                FROM company.kis_closing_price_sale 
                ORDER BY date DESC 
                LIMIT 1
            `)

            return NextResponse.json({
                latestDate: typeof res.rows[0]?.date === 'string' ? res.rows[0].date.split('T')[0] : (res.rows[0]?.date?.toISOString().split('T')[0] || null)
            })
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
