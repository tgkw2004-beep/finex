import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const query = `
            SELECT ROW_NUMBER() OVER(ORDER BY AVG(sdd.dividend_yield_cash) DESC) AS rank,
                   coalesce(mcl.wics_name1, '미분류') AS industry_name,
                   AVG(sdd.dividend_yield_cash) AS avg_dividend_yield
            FROM company.seibro_div_detail sdd
            LEFT OUTER JOIN company.master_company_list mcl  
              ON mcl.stock_code = sdd.stock_code 
            WHERE dividend_yield_cash IS NOT NULL
              AND CAST(SUBSTR(report_date,1,4) AS INT) BETWEEN EXTRACT(YEAR FROM CURRENT_DATE) - 3 AND EXTRACT(YEAR FROM CURRENT_DATE) -1
              AND sdd.stock_type = '보통주'
            GROUP BY mcl.wics_name1
            ORDER BY avg_dividend_yield DESC
            LIMIT 10;
        `
        const res = await pool.query(query)

        return NextResponse.json({
            data: res.rows || []
        })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
