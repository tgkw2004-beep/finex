import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const getLatest = searchParams.get('latest')

        // 최신 데이터 날짜 조회 (visual.vsl_inv_strat_picks_swing 기준)
        if (getLatest === 'true') {
            const res = await pool.query(`
                SELECT MAX(reco_date)::date::text AS date 
                FROM visual.vsl_inv_strat_picks_swing
                WHERE inv_strat = '256기법분석(장기)'
            `)

            return NextResponse.json({ latestDate: res.rows[0]?.date || null })
        }

        // Stats mode for calendar counts
        const getStats = searchParams.get('stats')
        if (getStats === 'true') {
            const res = await pool.query(`
                WITH date_master AS (
                    SELECT date, ROW_NUMBER() OVER (ORDER BY date) as date_idx
                    FROM (SELECT DISTINCT date FROM company.krx_stocks_ohlcv) AS d
                ),
                tmp00 AS (
                    SELECT date, stock_code, macd, signal, rsi
                    FROM visual.vsl_anly_stocks_price_subindex02
                ),
                tmp01 AS (
                    SELECT date, stock_code, rsi, macd, signal,
                           LAG(macd) OVER (PARTITION BY stock_code ORDER BY date) as lag_macd,
                           LAG(signal) OVER (PARTITION BY stock_code ORDER BY date) as lag_signal
                    FROM tmp00
                ),
                tmp_signals AS (
                    SELECT s.date, s.stock_code, dm.date_idx
                    FROM tmp01 s
                    JOIN date_master dm ON s.date = dm.date
                    WHERE s.lag_macd < s.lag_signal AND s.macd > s.signal
                      AND s.rsi >= 30
                ),
                tmp_swing AS (
                    SELECT t.reco_date, t.stock_code, dm.date_idx as reco_idx
                    FROM visual.vsl_inv_strat_picks_swing t
                    JOIN date_master dm ON t.reco_date = dm.date
                    WHERE t.inv_strat = '256기법분석(장기)'
                      AND t.inv_strat_dtl IN ('장기1_3일선60일돌파(역배열224일>112일>60일)', '장기4_5일선60일돌파(역배열224일>112일>60일)')
                      AND t.reco_date >= CURRENT_DATE - INTERVAL '1 month'
                      AND t.stock_name NOT LIKE '%스팩%'
                )
                SELECT date, count(*) as count
                FROM (
                    SELECT DISTINCT ON (sig.date, sig.stock_code, sw.inv_strat_dtl)
                        sig.date, sig.stock_code, sw.inv_strat_dtl
                    FROM tmp_signals sig
                    INNER JOIN tmp_swing sw 
                        ON sig.stock_code = sw.stock_code
                        AND sig.date_idx BETWEEN sw.reco_idx AND sw.reco_idx + 5
                ) AS final
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

        // 장기1_3일선60일돌파
        const query1 = `
            WITH date_master AS (
                SELECT date 
                     , ROW_NUMBER() OVER (ORDER BY date) as date_idx
                FROM (SELECT DISTINCT date FROM company.krx_stocks_ohlcv
                      WHERE date >= $1::date - INTERVAL '3 month') AS d
            ),
            tmp00 AS (
                SELECT date
                     , stock_code
                     , stock_name
                     , macd
                     , signal
                     , rsi
                FROM visual.vsl_anly_stocks_price_subindex02
                WHERE date >= $1::date - INTERVAL '2 month'
                  AND date <= $1::date
            ),
            tmp01 AS (
                SELECT date
                     , stock_code
                     , stock_name
                     , rsi
                     , LAG(macd) OVER (PARTITION BY stock_code ORDER BY date) as lag_macd
                     , LAG(signal) OVER (PARTITION BY stock_code ORDER BY date) as lag_signal
                     , macd
                     , signal
                FROM tmp00
            ),
            tmp_signals AS (
                SELECT s.*
                     , dm.date_idx
                FROM tmp01 s
                JOIN date_master dm ON s.date = dm.date
                WHERE s.lag_macd < s.lag_signal AND s.macd > s.signal
                  AND s.rsi >= 30
                  AND s.date = $1::date
            ),
            tmp_swing AS (
                SELECT t.reco_date
                     , t.stock_code
                     , t.stock_name
                     , dm.date_idx as reco_idx
                FROM visual.vsl_inv_strat_picks_swing t
                JOIN date_master dm ON t.reco_date = dm.date
                WHERE t.reco_date >= $1::date - INTERVAL '1 month'
                  AND t.reco_date <= $1::date
                  AND t.inv_strat = '256기법분석(장기)'
                  AND t.inv_strat_dtl = '장기1_3일선60일돌파(역배열224일>112일>60일)'
            ),
            tmp_fscore AS (
                SELECT code
                     , f_score
                FROM (
                    SELECT code
                         , f_score
                         , ROW_NUMBER() OVER (PARTITION BY code ORDER BY bsns_year DESC, 
                           CASE reprt_code WHEN '11014' THEN 4 WHEN '11011' THEN 3 WHEN '11012' THEN 2 WHEN '11013' THEN 1 ELSE 0 END DESC) as rn
                    FROM company.dart_fs_fscore
                ) a WHERE rn = 1
            )
            SELECT TO_CHAR(sig.date, 'yyyy-mm-dd') AS "추천일자"
                 , sig.stock_name AS "종목명"
                 , sig.stock_code AS "종목코드"
                 , CASE 
                    WHEN kpi.shortcode IS NOT NULL THEN 'KOSPI'
                    WHEN kdi.shortcode IS NOT NULL THEN 'KOSDAQ'
                    ELSE ''
                   END AS "시장구분명"
                 , vsl.wics_name AS "WICS명"
                 , fs.f_score AS "F_SCORE"
            FROM tmp_signals sig
            INNER JOIN tmp_swing sw 
                ON sig.stock_code = sw.stock_code
                AND sig.date_idx BETWEEN sw.reco_idx AND sw.reco_idx + 5
            LEFT JOIN (SELECT DISTINCT shortcode FROM company.kis_kospi_info) kpi 
                ON sig.stock_code = kpi.shortcode
            LEFT JOIN (SELECT DISTINCT shortcode FROM company.kis_kosdaq_info) kdi 
                ON sig.stock_code = kdi.shortcode
            LEFT JOIN (select stock_code, wics_name from visual.vsl_anly_stocks_price_subindex01 group by 1,2) vsl
                ON sig.stock_code = vsl.stock_code
            LEFT JOIN tmp_fscore fs 
                ON sig.stock_code = fs.code
            WHERE sig.date = $1::date
            group by sig.date, sig.stock_code, kpi.shortcode, kdi.shortcode, vsl.wics_name, fs.f_score, sig.stock_name
            ORDER BY sig.date DESC;
        `

        // 장기4_5일선60일돌파
        const query4 = `
            WITH date_master AS (
                SELECT date 
                     , ROW_NUMBER() OVER (ORDER BY date) as date_idx
                FROM (SELECT DISTINCT date FROM company.kis_today_ma
                      WHERE date >= $1::date - INTERVAL '3 month') AS d
            ),
            tmp00 AS (
                SELECT date
                     , stock_code
                     , stock_name
                     , macd
                     , signal
                     , rsi
                FROM company.kis_today_ma
                WHERE date >= $1::date - INTERVAL '2 month'
                  AND date <= $1::date
            ),
            tmp01 AS (
                SELECT date
                     , stock_code
                     , stock_name
                     , rsi
                     , LAG(macd) OVER (PARTITION BY stock_code ORDER BY date) as lag_macd
                     , LAG(signal) OVER (PARTITION BY stock_code ORDER BY date) as lag_signal
                     , macd
                     , signal
                FROM tmp00
            ),
            tmp_signals AS (
                SELECT s.*
                     , dm.date_idx
                FROM tmp01 s
                JOIN date_master dm ON s.date = dm.date
                WHERE s.lag_macd < s.lag_signal AND s.macd > s.signal
                  AND s.rsi >= 30
                  AND s.date = $1::date
            ),
            tmp_swing AS (
                SELECT t.reco_date
                     , t.stock_code
                     , t.stock_name
                     , dm.date_idx as reco_idx
                FROM visual.vsl_inv_strat_picks_swing t
                JOIN date_master dm ON t.reco_date = dm.date
                WHERE t.reco_date >= $1::date - INTERVAL '1 month'
                  AND t.reco_date <= $1::date
                  AND t.inv_strat = '256기법분석(장기)'
                  AND t.inv_strat_dtl = '장기4_5일선60일돌파(역배열224일>112일>60일)'
            ),
            tmp_fscore AS (
                SELECT code
                     , f_score
                FROM (
                    SELECT code
                         , f_score
                         , ROW_NUMBER() OVER (PARTITION BY code ORDER BY bsns_year DESC, 
                           CASE reprt_code WHEN '11014' THEN 4 WHEN '11011' THEN 3 WHEN '11012' THEN 2 WHEN '11013' THEN 1 ELSE 0 END DESC) as rn
                    FROM company.dart_fs_fscore
                ) a WHERE rn = 1
            )
            SELECT TO_CHAR(sig.date, 'yyyy-mm-dd') AS "추천일자"
                 , sig.stock_name AS "종목명"
                 , sig.stock_code AS "종목코드"
                 , CASE 
                    WHEN kpi.shortcode IS NOT NULL THEN 'KOSPI'
                    WHEN kdi.shortcode IS NOT NULL THEN 'KOSDAQ'
                    ELSE ''
                   END AS "시장구분명"
                 , vsl.wics_name AS "WICS명"
                 , fs.f_score AS "F_SCORE"
            FROM tmp_signals sig
            INNER JOIN tmp_swing sw 
                ON sig.stock_code = sw.stock_code
                AND sig.date_idx BETWEEN sw.reco_idx AND sw.reco_idx + 5
            LEFT JOIN (SELECT DISTINCT shortcode FROM company.kis_kospi_info) kpi 
                ON sig.stock_code = kpi.shortcode
            LEFT JOIN (SELECT DISTINCT shortcode FROM company.kis_kosdaq_info) kdi 
                ON sig.stock_code = kdi.shortcode
            LEFT JOIN (select stock_code, wics_name from visual.vsl_anly_stocks_price_subindex01 group by 1,2) vsl
                ON sig.stock_code = vsl.stock_code
            LEFT JOIN tmp_fscore fs 
                ON sig.stock_code = fs.code
            WHERE sig.date = $1::date
            group by sig.date, sig.stock_code, kpi.shortcode, kdi.shortcode, vsl.wics_name, fs.f_score, sig.stock_name
            ORDER BY sig.date DESC;
        `
        
        const [res1, res4] = await Promise.all([
            pool.query(query1, [date]),
            pool.query(query4, [date])
        ])

        return NextResponse.json({
            long1: res1.rows || [],
            long4: res4.rows || []
        })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
