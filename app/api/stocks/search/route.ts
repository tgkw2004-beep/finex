import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query) {
        return NextResponse.json({ results: [] })
    }

    try {
        // Search by stock_name or stock_code
        // Using ilike for case-insensitive search
        // Limit results to 10 for performance
        const res = await pool.query(`
            SELECT stock_name, stock_code 
            FROM company.master_company_list 
            WHERE stock_name ILIKE $1 OR stock_code ILIKE $1 
            LIMIT 10
        `, [`%${query}%`])

        return NextResponse.json({ results: res.rows || [] })
    } catch (error) {
        console.error('Stock search exception:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
