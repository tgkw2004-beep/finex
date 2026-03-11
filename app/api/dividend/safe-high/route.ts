import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const result = await pool.query(`
            WITH
            -- ① 연도 범위 한 번만 계산
            year_range AS (
                SELECT
                    CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) < 5
                        THEN EXTRACT(YEAR FROM CURRENT_DATE)::int - 4
                        ELSE EXTRACT(YEAR FROM CURRENT_DATE)::int - 3
                    END AS y_from,
                    CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) < 5
                        THEN EXTRACT(YEAR FROM CURRENT_DATE)::int - 2
                        ELSE EXTRACT(YEAR FROM CURRENT_DATE)::int - 1
                    END AS y_to,
                    CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) < 5
                        THEN EXTRACT(YEAR FROM CURRENT_DATE)::int - 2
                        ELSE EXTRACT(YEAR FROM CURRENT_DATE)::int - 1
                    END AS target_year   -- cap/vol 조회 기준 연도
            ),
            -- ② 배당 데이터 집계 (필터 선행)
            agg AS (
                SELECT
                    b.stock_name,
                    b.stock_type,
                    b.stock_code,
                    COUNT(DISTINCT CAST(SUBSTR(b.report_date, 1, 4) AS INT))     AS consecutive_years,
                    AVG(b.payout_ratio)                                           AS avg_payout_ratio,
                    STDDEV(b.payout_ratio)                                        AS std_payout_ratio,
                    AVG(b.dividend_yield_cash)                                    AS avg_dividend_yield_cash,
                    AVG(b.dps / NULLIF(b.payout_ratio / 100.0, 0))               AS avg_eps
                FROM company.seibro_div_detail b, year_range yr
                WHERE
                    CAST(SUBSTR(b.report_date, 1, 4) AS INT) BETWEEN yr.y_from AND yr.y_to
                    AND b.dividend_yield_cash IS NOT NULL
                    AND b.payout_ratio        IS NOT NULL
                    AND b.dps                 IS NOT NULL
                    AND b.stock_type = '보통주'
                GROUP BY b.stock_name, b.stock_type, b.stock_code
            ),
            -- ③ 1차 필터: 비싼 join 전에 배당 조건만으로 후보 축소
            agg_filtered AS (
                SELECT *
                FROM agg
                WHERE
                    avg_payout_ratio BETWEEN 30 AND 60
                    AND std_payout_ratio < 20
                    AND avg_eps       > 2000
                    AND consecutive_years = 3
            ),
            -- ④ 후보 종목에 대해서만 시가총액 조회 (target_year 1개만)
            cap_info AS (
                SELECT DISTINCT ON (k.code)
                    k.code,
                    k.cap
                FROM company.krx_stocks_cap k, year_range yr
                WHERE k.code IN (SELECT stock_code FROM agg_filtered)
                  AND EXTRACT(YEAR FROM k.date) = yr.target_year
                ORDER BY k.code, k.date DESC
            ),
            -- ⑤ 후보 종목에 대해서만 변동성 조회 (target_year 1개만)
            relative_vol AS (
                SELECT
                    code,
                    STDDEV(close) / NULLIF(AVG(close), 0) AS rel_vol
                FROM company.krx_stocks_ohlcv, year_range yr
                WHERE code IN (SELECT stock_code FROM agg_filtered)
                  AND EXTRACT(YEAR FROM date) = yr.target_year
                  AND close > 0
                GROUP BY code
            )
            SELECT
                ROW_NUMBER() OVER (ORDER BY a.avg_dividend_yield_cash DESC) AS rank,
                a.stock_name,
                a.stock_code,
                a.stock_type,
                ROUND(a.avg_dividend_yield_cash::numeric, 2) AS avg_dividend_yield,
                ROUND(a.avg_eps::numeric, 2)                  AS avg_eps,
                ROUND(a.avg_payout_ratio::numeric, 2)         AS avg_payout_ratio,
                ROUND(a.std_payout_ratio::numeric, 2)         AS std_payout_ratio,
                ROUND((c.cap / 100000000.0)::numeric, 1)      AS market_cap_eok,
                ROUND(rv.rel_vol::numeric, 3)                  AS relative_volatility
            FROM agg_filtered a
            JOIN cap_info      c  ON c.code  = a.stock_code
            JOIN relative_vol  rv ON rv.code = a.stock_code
            WHERE
                c.cap  >= 300000000000
                AND rv.rel_vol < 0.15
            ORDER BY a.avg_dividend_yield_cash DESC, a.avg_eps DESC
            LIMIT 20
        `)

        return NextResponse.json({ data: result.rows })
    } catch (error: any) {
        console.error('Safe High Dividend API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
