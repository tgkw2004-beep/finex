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
                FROM visual.vsl_inv_strat_picks_trend 
                WHERE inv_strat_dtl IN ('연기금 순매수량 대표종목', '거래대금TOP30')
            `)

            return NextResponse.json({ latestDate: res.rows[0]?.date || null })
        }

        // Stats mode for calendar counts
        const getStats = searchParams.get('stats')
        if (getStats === 'true') {
            const res = await pool.query(`
                WITH picks AS (
                    SELECT reco_date, stock_code, stock_name, inv_strat_dtl
                    FROM visual.vsl_inv_strat_picks_trend
                    WHERE inv_strat_dtl IN ('연기금 순매수량 대표종목', '거래대금TOP30')
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
                        s.macd,
                        s.signal,
                        LAG(s.macd, 1) OVER(PARTITION BY s.stock_code ORDER BY s.date) AS lag_macd,
                        LAG(s.signal, 1) OVER(PARTITION BY s.stock_code ORDER BY s.date) AS lag_signal,
                        s.rsi,
                        (s.close - AVG(s.close) OVER(PARTITION BY s.stock_code ORDER BY s.date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW))
                        / NULLIF(STDDEV(s.close) OVER(PARTITION BY s.stock_code ORDER BY s.date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW), 0) AS price_z_score
                    FROM base_price s
                ),
                stats_ext AS (
                    SELECT 
                        s.*,
                        MIN(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS hist_lowest_14,
                        AVG(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_avg_20,
                        STDDEV(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_std_20,
                        MAX(macd - signal) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 60 PRECEDING AND 10 PRECEDING) AS max_hist_past
                    FROM stats s
                ),
                final_filtered AS (
                    SELECT DISTINCT ON (s.date, s.stock_code, p.inv_strat_dtl)
                        s.date, s.stock_code, p.inv_strat_dtl
                    FROM stats_ext s
                    JOIN picks p ON s.stock_code = p.stock_code 
                      AND s.date BETWEEN p.reco_date AND p.reco_date + INTERVAL '5 day'
                    WHERE (
                        (
                            p.inv_strat_dtl = '연기금 순매수량 대표종목' AND (
                                (histogram < 0 AND lag2_histogram > lag_histogram AND lag_histogram < histogram AND rsi BETWEEN 30 AND 60 AND (lag_histogram - hist_avg_20) / NULLIF(hist_std_20, 0) <= -2.0 AND max_hist_past > 0 AND max_hist_past >= ABS(hist_lowest_14) * 1.2)
                                OR
                                (lag_histogram < 0 AND histogram >= 0 AND rsi BETWEEN 30 AND 60 AND (lag_histogram - hist_avg_20) / NULLIF(hist_std_20, 0) <= -2.0 AND max_hist_past > 0 AND max_hist_past >= ABS(hist_lowest_14) * 1.2)
                            )
                        )
                        OR
                        (
                            p.inv_strat_dtl = '거래대금TOP30' AND (
                                (macd > 0 AND signal > 0 AND lag_macd < lag_signal AND macd > signal AND rsi BETWEEN 45 AND 70 AND (lag_histogram - hist_avg_20) / NULLIF(hist_std_20, 0) BETWEEN -1.5 AND 1)
                            )
                        )
                    )
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

        // 전략 1: 연기금 순매수량 대표종목
        const query1 = `
            WITH picks AS(
                SELECT DISTINCT stock_code,reco_date,stock_name
                FROM visual.vsl_inv_strat_picks_trend
                WHERE inv_strat_dtl='연기금 순매수량 대표종목'
                  AND reco_date >= $1::date - INTERVAL '10 day'
                  AND reco_date <= $1::date
            ),
            momentum AS(
                SELECT
                    m.date,
                    m.stock_code,
                    m.macd-m.signal AS histogram,
                    LAG(m.macd-m.signal,1) OVER(PARTITION BY m.stock_code ORDER BY m.date) AS lag_histogram,
                    LAG(m.macd-m.signal,2) OVER(PARTITION BY m.stock_code ORDER BY m.date) AS lag2_histogram,
                    m.rsi
                FROM visual.vsl_anly_stocks_price_subindex02 m
                JOIN (SELECT DISTINCT stock_code FROM picks) p
                  ON m.stock_code=p.stock_code
                WHERE m.date >= $1::date - INTERVAL '3 month'
                  AND m.date <= $1::date
            ),
            histo_ext AS(
                SELECT
                    m.*,
                    MIN(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS hist_lowest_14,
                    AVG(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_avg_20,
                    STDDEV(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_std_20,
                    MAX(histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 60 PRECEDING AND 10 PRECEDING) AS max_hist_past
                FROM momentum m
            ),
            price_stat AS(
                SELECT
                    p.date,
                    p.stock_code,
                    p.wics_name
                FROM visual.vsl_anly_stocks_price_subindex01 p
                JOIN (SELECT DISTINCT stock_code FROM picks) t
                  ON p.stock_code=t.stock_code
                WHERE p.date >= $1::date - INTERVAL '3 month'
                  AND p.date <= $1::date
            ),
            signal AS(
                SELECT
                    h.date,
                    h.stock_code,
                    ps.wics_name,
                    h.histogram,
                    h.lag_histogram,
                    h.lag2_histogram,
                    h.rsi,
                    (h.lag_histogram-h.hist_avg_20)/NULLIF(h.hist_std_20,0) AS z_score,
                    h.max_hist_past,
                    h.hist_lowest_14,
                    CASE 
                        WHEN h.histogram<0
                         AND h.lag2_histogram>h.lag_histogram
                         AND h.lag_histogram<h.histogram
                         AND h.rsi BETWEEN 30 AND 60
                         AND (h.lag_histogram-h.hist_avg_20)/NULLIF(h.hist_std_20,0)<=-2.0
                         AND h.max_hist_past>0
                         AND h.max_hist_past>=ABS(h.hist_lowest_14)*1.2
                        THEN '전략A'
                        WHEN h.lag_histogram<0
                         AND h.histogram>=0
                         AND h.rsi BETWEEN 30 AND 60
                         AND (h.lag_histogram-h.hist_avg_20)/NULLIF(h.hist_std_20,0)<=-2.0
                         AND h.max_hist_past>0
                         AND h.max_hist_past>=ABS(h.hist_lowest_14)*1.2
                        THEN '전략B'
                    END AS entry_type
                FROM histo_ext h
                JOIN price_stat ps ON h.stock_code=ps.stock_code AND h.date=ps.date
            ),
            market AS(
                SELECT DISTINCT ON(code) code,mrktclsfnm
                FROM company.public_loan_tran
                ORDER BY code
            )
            SELECT DISTINCT ON(s.date,s.stock_code,s.entry_type)
                TO_CHAR(s.date,'YYYY-MM-DD') AS "추천일자",
                s.stock_code AS "종목코드",
                m.mrktclsfnm AS "시장구분",
                s.wics_name AS "WICS명",
                p.stock_name AS "종목명"
            FROM signal s
            JOIN picks p
              ON s.stock_code=p.stock_code
             AND s.date BETWEEN p.reco_date AND p.reco_date+INTERVAL '5 day'
            LEFT JOIN market m ON s.stock_code=m.code
            WHERE s.entry_type IS NOT NULL
              AND p.stock_name NOT LIKE '%스팩%'
              AND s.date = $1::date
            ORDER BY s.date DESC,s.stock_code,s.entry_type;
        `

        // 전략 2: 연기금 3일 연속 순매수
        const query2 = `
            WITH picks AS(
                SELECT
                    reco_date,
                    stock_code,
                    stock_name
                FROM visual.vsl_inv_strat_picks_trend
                WHERE inv_strat_dtl='거래대금TOP30'
                  AND reco_date >= $1::date - INTERVAL '10 day'
                  AND reco_date <= $1::date
            ),
            target_stocks AS(
                SELECT DISTINCT stock_code FROM picks
            ),
            base_price02 AS(
                SELECT a.*
                FROM visual.vsl_anly_stocks_price_subindex02 a
                JOIN target_stocks t ON a.stock_code=t.stock_code
                WHERE a.date >= $1::date - INTERVAL '4 month'
                  AND a.date <= $1::date
            ),
            base_price01 AS(
                SELECT a.*
                FROM visual.vsl_anly_stocks_price_subindex01 a
                JOIN target_stocks t ON a.stock_code=t.stock_code
                WHERE a.date >= $1::date - INTERVAL '4 month'
                  AND a.date <= $1::date
            ),
            momentum AS(
                SELECT
                    date,
                    stock_code,
                    macd,
                    signal,
                    macd-signal AS histogram,
                    LAG(macd,1)OVER(PARTITION BY stock_code ORDER BY date) AS lag_macd,
                    LAG(signal,1)OVER(PARTITION BY stock_code ORDER BY date) AS lag_signal,
                    LAG(macd-signal,1)OVER(PARTITION BY stock_code ORDER BY date) AS lag_histogram,
                    LAG(macd-signal,2)OVER(PARTITION BY stock_code ORDER BY date) AS lag2_histogram,
                    rsi
                FROM base_price02
            ),
            price_stat AS(
                SELECT
                    date,
                    stock_code,
                    close,
                    wics_name,
                    (close-AVG(close)OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW))
                    /NULLIF(STDDEV(close)OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW),0) AS z_score
                FROM base_price01
            ),
            market AS(
                SELECT DISTINCT ON(code)
                    code,
                    mrktclsfnm
                FROM company.public_loan_tran
                ORDER BY code
            ),
            histo_ext AS(
                SELECT
                    m.*,
                    MIN(lag_histogram)OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS hist_lowest_14,
                    AVG(lag_histogram)OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_avg_20,
                    STDDEV(lag_histogram)OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_std_20,
                    MAX(histogram)OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 60 PRECEDING AND 10 PRECEDING) AS max_hist_past
                FROM momentum m
            ),
            signal_base AS(
                SELECT
                    h.date,
                    h.stock_code,
                    p.wics_name,
                    h.macd,
                    h.signal,
                    h.lag_macd,
                    h.lag_signal,
                    h.histogram,
                    h.lag_histogram,
                    h.lag2_histogram,
                    h.rsi,
                    (h.lag_histogram-h.hist_avg_20)/NULLIF(h.hist_std_20,0) AS z_score,
                    h.max_hist_past,
                    h.hist_lowest_14
                FROM histo_ext h
                JOIN price_stat p
                  ON h.stock_code=p.stock_code
                 AND h.date=p.date
            ),
            final_signal AS(
                SELECT '기본' AS entry_type,* FROM signal_base
                UNION ALL
                SELECT '연기금눌림B',* FROM signal_base
                WHERE macd>0 AND signal>0
                  AND lag_macd<lag_signal
                  AND macd>signal
                  AND rsi BETWEEN 45 AND 70
                  AND z_score BETWEEN -1.5 AND 1
            )
            SELECT DISTINCT ON(s.date,s.stock_code,entry_type)
                TO_CHAR(s.date,'YYYY-MM-DD') AS "일자",
                s.stock_code AS "종목코드",
                m.mrktclsfnm AS "시장구분",
                s.wics_name AS "wics명",
                p.stock_name AS "종목명"
            FROM final_signal s
            JOIN picks p
              ON s.stock_code=p.stock_code
             AND s.date BETWEEN p.reco_date AND p.reco_date+INTERVAL'5 day'
            LEFT JOIN market m
              ON s.stock_code=m.code
            WHERE entry_type<>'기본'
              AND p.stock_name NOT LIKE '%스팩%'
              AND s.date = $1::date
            ORDER BY s.date DESC, s.stock_code, entry_type;
        `

        const [res1, res2] = await Promise.all([
            pool.query(query1, [date]),
            pool.query(query2, [date])
        ])

        return NextResponse.json({
            representative: res1.rows || [],
            consecutive: res2.rows || [],
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
