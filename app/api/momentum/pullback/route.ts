import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const stockName = searchParams.get('name') // optional stock name filter
    const date = searchParams.get('date')       // optional date filter

    try {
        const params: any[] = []
        let nameFilter = ''
        let dateFilter = ''

        if (stockName) {
            params.push(stockName)
            nameFilter = `AND name ILIKE '%' || $${params.length} || '%'`
        }
        if (date) {
            params.push(date)
            dateFilter = `AND date = $${params.length}`
        }

        const result = await pool.query(`
            WITH stock_data AS (
                SELECT a.code 
                     , a.date 
                     , a.open
                     , a.close
                     , a.high
                     , a.low
                     , ROUND((a.high - a.open) / NULLIF(a.open, 0.0000), 4) AS rise_percentage
                     , a.trade_value 
                     , b.cap
                     , c.name
                FROM company.krx_stocks_ohlcv AS a
                LEFT JOIN company.krx_stocks_cap AS b
                    ON a.code = b.code AND a.date = b.date
                INNER JOIN company.krx_company_info AS c
                    ON a.code = c.code
                WHERE a.date >= CURRENT_DATE - INTERVAL '1 month'
            ),
            l_stocks AS (
                SELECT date, code, name, open, close, high, low, rise_percentage, trade_value, cap
                FROM stock_data
                WHERE rise_percentage >= 0.10
                  AND trade_value > 100000000000
                  AND cap >= 10000000000000
            ),
            m_stocks AS (
                SELECT date, code, name, open, close, high, low, rise_percentage, trade_value, cap
                FROM stock_data
                WHERE rise_percentage >= 0.15
                  AND trade_value > 100000000000
                  AND cap < 10000000000000
            ),
            s_stocks AS (
                SELECT date, code, name, open, close, high, low, rise_percentage, trade_value, cap
                FROM stock_data
                WHERE rise_percentage >= 0.15
                  AND trade_value > 50000000000
            ),
            t_stocks AS (
                SELECT * FROM l_stocks
                UNION
                SELECT * FROM m_stocks
                UNION
                SELECT * FROM s_stocks
            ),
            final AS (
                SELECT *
                     , CASE WHEN rise_percentage >= 0.10 AND cap >= 10000000000000 THEN '대형주&상승률 10%이상'
                            WHEN rise_percentage >= 0.15 AND cap < 10000000000000 THEN '상승률 15%이상'
                            ELSE '단순 상승률 15%이상' END AS select_reason
                     , ROUND(open + (close - open) * 0.04, 1) AS line60
                FROM t_stocks
            )
            SELECT 
                TO_CHAR(date, 'yyyy-mm-dd') AS "기준봉 일자"
              , code AS "종목코드"
              , name AS "종목명"
              , open AS "시가"
              , close AS "종가"
              , ROUND(rise_percentage * 100, 2) AS "상승률"
              , trade_value AS "거래대금"
              , select_reason AS "선정이유"
              , line60 AS "눌림목 지점"
            FROM final
            WHERE 1=1
            ${nameFilter}
            ${dateFilter}
            ORDER BY date DESC, trade_value DESC, rise_percentage DESC
        `, params)

        return NextResponse.json({
            data: result.rows,
            total: result.rows.length
        })

    } catch (error: any) {
        console.error('Pullback API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
