import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const getLatest = searchParams.get('latest')

        // Get latest available date from visual.vsl_macd_btm_supply
        if (getLatest === 'true') {
            const res = await pool.query(`
                SELECT MAX(date AT TIME ZONE 'Asia/Seoul')::date::text AS date 
                FROM visual.vsl_macd_btm_supply
            `)

            return NextResponse.json({ latestDate: res.rows[0]?.date || null })
        }

        // Stats mode for calendar counts
        const getStats = searchParams.get('stats')
        if (getStats === 'true') {
            const res = await pool.query(`
                SELECT to_char(date, 'yyyy-MM-dd') as date
                     , count(*) as count
                FROM visual.vsl_macd_btm_supply
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

        // Fetch rebound strategy data using the provided SQL
        const query = `
            WITH tmp01 AS (
                SELECT stock_name
                     , stock_code
                     , STRING_AGG(theme_code, ', ') AS theme_codes
                     , STRING_AGG(theme_name, ',') AS theme_names
                     , STRING_AGG(theme_info, '|') AS theme_info
                     , ANY_VALUE(stock_info) AS stock_info
                  FROM company.naver_theme
                 GROUP BY stock_name, stock_code
            )
            , tmp02 AS (
                SELECT t1.*
                     , t2.theme_names
                     , t2.theme_info
                     , t2.stock_info
                  FROM visual.vsl_macd_btm_supply AS t1
                  LEFT JOIN tmp01 AS t2
                    ON t1.stock_code = t2.stock_code
            )
            SELECT to_char(date, 'yyyy-MM-dd') AS "date_str"
                 , stock_name
                 , theme_names
                 , stock_info
                 , val_top300
                 , whol_smtn_ntby_tr_pbmn
                 , (frgn_ntby_qty + orgn_ntby_qty) AS supply_total
                 , inv_strat_dtl
                 , abc_all
                 , prg_accum_signal
                 , stock_code
                 , close
                 , trade_value
                 , val_rank
                 , supply_buy
                 , z_score
              FROM tmp02
             WHERE date = $1
             ORDER BY date DESC, abc_all DESC, val_rank ASC, sum_fake_ntby_qty desc, whol_smtn_ntby_tr_pbmn desc;
        `
        
        const result = await pool.query(query, [date])

        return NextResponse.json({
            data: result.rows || [],
            count: (result.rows?.length || 0)
        })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
