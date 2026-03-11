import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const result = await pool.query(`
            WITH filtered AS (
                SELECT 
                    stock_name,
                    stock_type,
                    CAST(SUBSTR(report_date, 1, 4) AS INT) AS report_year,
                    dps,
                    payout_ratio,
                    dividend_yield_cash
                FROM company.seibro_div_detail
                WHERE 
                    CAST(SUBSTR(report_date, 1, 4) AS INT) BETWEEN 
                        CASE 
                            WHEN EXTRACT(MONTH FROM CURRENT_DATE) < 5 THEN EXTRACT(YEAR FROM CURRENT_DATE) - 4
                            ELSE EXTRACT(YEAR FROM CURRENT_DATE) - 3 
                        END
                        AND 
                        CASE 
                            WHEN EXTRACT(MONTH FROM CURRENT_DATE) < 5 THEN EXTRACT(YEAR FROM CURRENT_DATE) - 2
                            ELSE EXTRACT(YEAR FROM CURRENT_DATE) - 1 
                        END
                    AND dps IS NOT NULL 
                    AND dps > 0
                    AND payout_ratio IS NOT NULL
                    AND stock_type = '보통주'
            ),
            ranked AS (
                SELECT *,
                       ROW_NUMBER() OVER (PARTITION BY stock_name, stock_type ORDER BY report_year ASC) AS rn_asc,
                       ROW_NUMBER() OVER (PARTITION BY stock_name, stock_type ORDER BY report_year DESC) AS rn_desc
                FROM filtered
            ),
            agg AS (
                SELECT 
                    stock_name,
                    stock_type,
                    COUNT(DISTINCT report_year) AS cnt_year,
                    MIN(report_year) AS min_year,
                    MAX(report_year) AS max_year,
                    AVG(dividend_yield_cash) AS avg_dy,
                    STDDEV(payout_ratio) AS std_payout_ratio
                FROM filtered
                GROUP BY stock_name, stock_type
            ),
            final AS (
                SELECT
                    a.stock_name,
                    a.stock_type,
                    a.cnt_year,
                    a.min_year,
                    a.max_year,
                    f1.dps AS start_dps,
                    f2.dps AS end_dps,
                    a.avg_dy,
                    a.std_payout_ratio,
                    CASE
                        WHEN a.cnt_year = 3 AND a.max_year - a.min_year = 2 AND a.std_payout_ratio <= 20 THEN
                            POWER(1.0 * f2.dps / NULLIF(f1.dps, 0), 1.0 / (a.cnt_year - 1)) - 1
                        ELSE NULL
                    END AS dps_gr
                FROM agg a
                LEFT JOIN ranked f1 ON a.stock_name = f1.stock_name AND a.stock_type = f1.stock_type AND f1.rn_asc = 1
                LEFT JOIN ranked f2 ON a.stock_name = f2.stock_name AND a.stock_type = f2.stock_type AND f2.rn_desc = 1
            )
            SELECT
                ROW_NUMBER() OVER (ORDER BY avg_dy DESC, dps_gr DESC) AS rank,
                stock_name, stock_type, dps_growth_rate,
                avg_dividend_yield, std_payout_ratio,
                undervaluation_eval, stock_code
            FROM (
                SELECT DISTINCT ON (T1.stock_name)
                    T1.stock_name,
                    T1.stock_type,
                    ROUND((T1.dps_gr * 100)::numeric, 2) AS dps_growth_rate,
                    ROUND(T1.avg_dy::numeric, 2)          AS avg_dividend_yield,
                    ROUND(T1.std_payout_ratio::numeric, 2) AS std_payout_ratio,
                    T2.undervaluation_eval,
                    mc.stock_code,
                    T1.avg_dy,
                    T1.dps_gr
                FROM final AS T1
                LEFT JOIN visual.vsl_dividend_stock_evaluation AS T2
                  ON T1.stock_name = T2.koreanname
                LEFT JOIN (
                    SELECT DISTINCT ON (stock_name) stock_name, stock_code
                    FROM company.master_company_list
                    WHERE stock_code ~ '^[0-9]{6}$'
                      AND RIGHT(stock_code, 1) = '0'
                    ORDER BY stock_name, stock_code
                ) mc ON mc.stock_name = T1.stock_name
                WHERE T1.dps_gr IS NOT NULL
                  AND T1.avg_dy >= 4
                  AND T1.dps_gr >= 0.05
                ORDER BY T1.stock_name, T1.avg_dy DESC
            ) deduped
            ORDER BY avg_dy DESC, dps_gr DESC
            LIMIT 100
        `)

        return NextResponse.json({ data: result.rows })
    } catch (error: any) {
        console.error('Dividend Growth API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
