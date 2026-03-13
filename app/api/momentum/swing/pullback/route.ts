import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const getLatest = searchParams.get('latest')

        // 최신 데이터 날짜 조회
        if (getLatest === 'true') {
            const res = await pool.query(`
                SELECT MAX(reco_date)::date::text AS date 
                FROM visual.vsl_inv_strat_picks_swing 
                WHERE inv_strat = '눌림목매매_스윙'
            `)

            return NextResponse.json({ latestDate: res.rows[0]?.date || null })
        }

        // Stats mode for calendar counts
        const getStats = searchParams.get('stats')
        if (getStats === 'true') {
            const res = await pool.query(`
                WITH base_data AS (
                    SELECT DISTINCT ON (a.reco_date, a.stock_code, a.inv_strat_dtl)
                        a.reco_date, a.stock_code, a.inv_strat_dtl, b.rsi
                    FROM visual.vsl_inv_strat_picks_swing AS a
                    INNER JOIN visual.vsl_anly_stocks_price_subindex02 AS b 
                        ON a.reco_date = b.date AND a.stock_code = b.stock_code
                    WHERE a.inv_strat = '눌림목매매_스윙'
                      AND a.reco_date >= CURRENT_DATE - INTERVAL '1 month'
                )
                SELECT to_char(reco_date, 'yyyy-MM-dd') as date, count(*) as count
                FROM base_data
                WHERE (inv_strat_dtl = '눌림목매매_일봉' AND rsi BETWEEN 60 AND 65)
                   OR (inv_strat_dtl = '눌림목매매_주봉1' AND rsi BETWEEN 50 AND 60)
                   OR (inv_strat_dtl = '눌림목매매_주봉2' AND rsi BETWEEN 55 AND 65)
                GROUP BY reco_date
                ORDER BY reco_date DESC
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

        // 공통 쿼리 템플릿
        const baseQuery = `
            WITH tmp00 AS (
                SELECT 
                    a.reco_date 
                    , a.stock_code
                    , a.stock_name
                    , c.f_score
                    , d.wics_name
                    , CASE 
                        WHEN a.stock_code = e.shortcode THEN 'KOSPI'
                        WHEN a.stock_code = f.shortcode THEN 'KOSDAQ'
                        ELSE 'KONEX'
                    END AS market_clsf
                    , a.inv_strat_dtl
                    , a.inv_strat
                    , b.rsi
                FROM visual.vsl_inv_strat_picks_swing AS a
                INNER JOIN (
                    SELECT date, stock_code, rsi
                    FROM visual.vsl_anly_stocks_price_subindex02 
                    WHERE date = $1::date
                ) AS b ON a.reco_date = b.date AND a.stock_code = b.stock_code
                INNER JOIN (
                    SELECT code, f_score
                    FROM (
                        SELECT code, f_score, 
                        ROW_NUMBER() OVER (PARTITION BY code ORDER BY bsns_year DESC, 
                        CASE reprt_code WHEN '11014' THEN 4 WHEN '11011' THEN 3 WHEN '11012' THEN 2 WHEN '11013' THEN 1 ELSE 0 END DESC) AS rn
                        FROM company.dart_fs_fscore
                    ) AS a2 WHERE rn = 1
                ) AS c ON a.stock_code = c.code
                INNER JOIN (
                    SELECT stock_code, wics_name, date
                    FROM visual.vsl_anly_stocks_price_subindex01
                    WHERE date = $1::date
                ) AS d ON a.reco_date = d.date AND a.stock_code = d.stock_code
                LEFT JOIN (SELECT DISTINCT shortcode FROM company.kis_kospi_info) AS e ON a.stock_code = e.shortcode
                LEFT JOIN (SELECT DISTINCT shortcode FROM company.kis_kosdaq_info) AS f ON a.stock_code = f.shortcode
                WHERE a.reco_date = $1::date
                AND a.inv_strat = '눌림목매매_스윙'
            )
            SELECT 
                TO_CHAR(reco_date, 'yyyy-MM-dd') AS "추천일자"
                , stock_name AS "종목명"
                , stock_code AS "종목코드"
                , market_clsf AS "시장구분명"
                , wics_name AS "WICS명"
                , f_score AS "F_SCORE"
            FROM tmp00
            WHERE inv_strat_dtl = $2
            AND rsi BETWEEN $3 AND $4
        `

        // 3가지 상세 전략 병렬 조회
        const [resEdge, resReturn, resPrime] = await Promise.all([
            pool.query(baseQuery, [date, '눌림목매매_일봉', 60, 65]),
            pool.query(baseQuery, [date, '눌림목매매_주봉1', 50, 60]),
            pool.query(baseQuery, [date, '눌림목매매_주봉2', 55, 65])
        ])

        return NextResponse.json({
            edge: resEdge.rows || [],
            return: resReturn.rows || [],
            prime: resPrime.rows || [],
            date: date
        })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
