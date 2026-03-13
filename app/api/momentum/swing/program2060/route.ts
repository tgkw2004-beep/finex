import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const getLatest = searchParams.get('latest')

        // 최신 데이터 날짜 조회 (vsl_inv_strat_picks_trend 기준)
        if (getLatest === 'true') {
            const res = await pool.query(`
                SELECT MAX(reco_date)::date::text AS date 
                FROM visual.vsl_inv_strat_picks_trend
                WHERE inv_strat = '2060프로그램매수'
            `)

            return NextResponse.json({ latestDate: res.rows[0]?.date || null })
        }

        // Stats mode for calendar counts
        const getStats = searchParams.get('stats')
        if (getStats === 'true') {
            const res = await pool.query(`
                WITH picks AS (
                    SELECT reco_date, stock_code, stock_name
                    FROM visual.vsl_inv_strat_picks_trend
                    WHERE inv_strat = '2060프로그램매수'
                    AND reco_date >= CURRENT_DATE - INTERVAL '1 month'
                ),
                base_price AS (
                    SELECT a.date, a.stock_code, a.macd, a.signal, a.rsi, b.close, b.wics_name
                    FROM visual.vsl_anly_stocks_price_subindex02 a
                    JOIN visual.vsl_anly_stocks_price_subindex01 b ON a.stock_code = b.stock_code AND a.date = b.date
                    WHERE a.date >= CURRENT_DATE - INTERVAL '3 month'
                ),
                stats AS (
                    SELECT 
                        s.date,
                        s.stock_code,
                        (s.macd - s.signal) AS histogram,
                        LAG(s.macd - s.signal, 1) OVER(PARTITION BY s.stock_code ORDER BY s.date) AS lag_histogram,
                        LAG(s.macd - s.signal, 2) OVER(PARTITION BY s.stock_code ORDER BY s.date) AS lag2_histogram,
                        s.rsi
                    FROM base_price s
                ),
                stats_ext AS (
                    SELECT 
                        s.*,
                        MIN(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS hist_lowest_14,
                        AVG(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_avg_20,
                        STDDEV(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_std_20,
                        MAX(histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 60 PRECEDING AND 10 PRECEDING) AS max_hist_past
                    FROM stats s
                ),
                final_filtered AS (
                    SELECT DISTINCT ON (s.date, s.stock_code)
                        s.date, s.stock_code
                    FROM stats_ext s
                    JOIN picks p ON s.stock_code = p.stock_code 
                      AND s.date BETWEEN p.reco_date AND p.reco_date + INTERVAL '5 day'
                    WHERE rsi BETWEEN 30 AND 60
                      AND (lag_histogram - hist_avg_20) / NULLIF(hist_std_20, 0) <= -2.0
                      AND max_hist_past > 0
                      AND max_hist_past >= ABS(hist_lowest_14) * 1.2
                      AND p.stock_name NOT LIKE '%스팩%'
                )
                SELECT to_char(date, 'yyyy-MM-dd') as date, count(*) as count
                FROM final_filtered
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

        // 2060프로그램 매수 전략 쿼리
        const query = `
            WITH picks AS (
                SELECT
                    reco_date,
                    stock_code,
                    stock_name,
                    close,
                    inv_strat,
                    inv_strat_dtl
                FROM visual.vsl_inv_strat_picks_trend
                WHERE inv_strat = '2060프로그램매수'
                  AND reco_date >= $1::date - INTERVAL '10 day'
                  AND reco_date <= $1::date
            ),
            momentum AS (
                SELECT
                    date,
                    stock_code,
                    macd-signal AS histogram,
                    LAG(macd-signal,1) OVER(PARTITION BY stock_code ORDER BY date) AS lag_histogram,
                    LAG(macd-signal,2) OVER(PARTITION BY stock_code ORDER BY date) AS lag2_histogram,
                    rsi
                FROM visual.vsl_anly_stocks_price_subindex02
                WHERE date >= $1::date - INTERVAL '3 month'
                  AND date <= $1::date
            ),
            price_stat AS (
                SELECT
                    date,
                    stock_code,
                    close,
                    wics_name,
                    (close-AVG(close) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW))
                    /NULLIF(STDDEV(close) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW),0) AS z_score_price
                FROM visual.vsl_anly_stocks_price_subindex01
                WHERE date >= $1::date - INTERVAL '3 month'
                  AND date <= $1::date
            ),
            market AS (
                SELECT DISTINCT ON (code)
                       code,
                       mrktclsfnm
                FROM company.public_loan_tran
                ORDER BY code
            ),
            histo_ext AS (
                SELECT
                    m.*,
                    MIN(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS hist_lowest_14,
                    AVG(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_avg_20,
                    STDDEV(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_std_20,
                    MAX(histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 60 PRECEDING AND 10 PRECEDING) AS max_hist_past
                FROM momentum m
            ),
            signal_base AS (
                SELECT
                    h.date,
                    h.stock_code,
                    p.wics_name,
                    h.histogram,
                    h.lag_histogram,
                    h.lag2_histogram,
                    h.rsi,
                    (h.lag_histogram-h.hist_avg_20)/NULLIF(h.hist_std_20,0) AS z_score_hist,
                    h.max_hist_past,
                    h.hist_lowest_14
                FROM histo_ext h
                JOIN price_stat p
                  ON h.stock_code=p.stock_code
                 AND h.date=p.date
            ),
            final_signal AS (
                SELECT '기본' AS entry_type,* FROM signal_base
                UNION ALL
                SELECT '전략A',* FROM signal_base
                WHERE 1=1
                  AND rsi BETWEEN 30 AND 60
                  AND z_score_hist<=-2.0
                  AND max_hist_past>0
                  AND max_hist_past>=ABS(hist_lowest_14)*1.2
            )
            SELECT DISTINCT ON (s.date,s.stock_code)
                TO_CHAR(s.date,'YYYY-MM-DD') AS "추천일자",
                m.code as "종목코드",
                m.mrktclsfnm AS "시장구분",
                s.wics_name AS "WICS명",
                p.stock_name AS "종목명"
            FROM final_signal s
            JOIN picks p
              ON s.stock_code=p.stock_code
             AND s.date BETWEEN p.reco_date AND p.reco_date + INTERVAL '5 day'
            LEFT JOIN market m
              ON s.stock_code = m.code
            WHERE entry_type<>'기본'
              AND p.stock_name NOT LIKE '%스팩%'
              AND s.date = $1::date
            ORDER BY s.date DESC, s.stock_code, entry_type;
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
