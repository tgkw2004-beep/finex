import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await params

        // 1. Get target company's wics_name
        const wicsRes = await pool.query(`
            SELECT DISTINCT wics_name
            FROM visual.vsl_anly_stocks_price_subindex01
            WHERE stock_code = $1
            LIMIT 1
        `, [symbol])

        const wicsName = wicsRes.rows[0]?.wics_name || ''

        // 2. Aggregate sector heatmap using provided query
        const sectorRes = await pool.query(`
            WITH wics_info AS (
                SELECT DISTINCT stock_code, wics_name, stock_name
                FROM visual.vsl_anly_stocks_price_subindex01
            ),
            cap_data AS (
                SELECT
                    code AS stock_code,
                    cap,
                    ROW_NUMBER() OVER (PARTITION BY code ORDER BY date DESC) AS rn_desc
                FROM company.krx_stocks_cap
                WHERE date BETWEEN CURRENT_DATE - INTERVAL '1 month' AND CURRENT_DATE
            ),
            price_data AS (
                SELECT
                    stock_code,
                    close,
                    ROW_NUMBER() OVER (PARTITION BY stock_code ORDER BY date ASC) AS rn_asc,
                    ROW_NUMBER() OVER (PARTITION BY stock_code ORDER BY date DESC) AS rn_desc
                FROM visual.vsl_anly_stocks_price_subindex01
                WHERE date BETWEEN CURRENT_DATE - INTERVAL '3 month' AND CURRENT_DATE
            ),
            pivot_cap AS (
                SELECT
                    stock_code,
                    MAX(CASE WHEN rn_desc = 1 THEN cap END) AS cap_now
                FROM cap_data
                GROUP BY stock_code
            ),
            pivot_price AS (
                SELECT
                    stock_code,
                    MAX(CASE WHEN rn_asc = 1 THEN close END) AS price_3m_ago,
                    MAX(CASE WHEN rn_desc = 1 THEN close END) AS price_now
                FROM price_data
                GROUP BY stock_code
            ),
            final_calculation AS (
                SELECT
                    w.wics_name,
                    c.cap_now,
                    ((p.price_now::numeric / NULLIF(p.price_3m_ago, 0)) - 1) * 100 AS price_rate_3m
                FROM pivot_cap c
                JOIN wics_info w ON c.stock_code = w.stock_code
                LEFT JOIN pivot_price p ON c.stock_code = p.stock_code
                WHERE c.cap_now IS NOT NULL
            )
            SELECT
                wics_name AS label,
                SUM(cap_now) AS size,
                ROUND(AVG(price_rate_3m), 2) AS color,
                CASE WHEN wics_name = $1 THEN 1 ELSE 0 END AS is_selected
            FROM final_calculation
            GROUP BY wics_name
            ORDER BY size DESC
        `, [wicsName])

        return NextResponse.json({
            sectors: sectorRes.rows,
            current_wics: wicsName
        })

    } catch (error: any) {
        console.error('Sector API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
