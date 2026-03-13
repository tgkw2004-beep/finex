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
                WHERE inv_strat_dtl IN (
                    '종목별 개수(거래대금 300억 이상)', 
                    '종목별 개수(거래대금 500억 이상)', 
                    '종목별 개수(거래대금 1000억 이상)'
                )
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
                    WHERE inv_strat_dtl IN (
                        '종목별 개수(거래대금 300억 이상)', 
                        '종목별 개수(거래대금 500억 이상)', 
                        '종목별 개수(거래대금 1000억 이상)'
                    )
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
                        AVG(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_avg_20,
                        STDDEV(lag_histogram) OVER(PARTITION BY stock_code ORDER BY date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_std_20
                    FROM stats s
                ),
                final_filtered AS (
                    -- Each strategy (300, 500, 1000) shows unique stocks for that specific strategy.
                    -- If a stock is in multiple strategies, the UI total (sum of list lengths) will count it multiple times.
                    -- But for a SINGLE strategy, a stock is only counted once even if it had multiple reco_dates.
                    SELECT DISTINCT ON (s.date, s.stock_code, p.inv_strat_dtl)
                        s.date, s.stock_code, p.inv_strat_dtl
                    FROM stats_ext s
                    JOIN picks p ON s.stock_code = p.stock_code 
                      AND s.date BETWEEN p.reco_date AND p.reco_date + INTERVAL '5 day'
                    WHERE (
                        (histogram > 0 AND lag2_histogram > lag_histogram AND lag_histogram < histogram AND rsi BETWEEN 45 AND 70 AND (lag_histogram - hist_avg_20) / NULLIF(hist_std_20, 0) BETWEEN -1.5 AND 0.5)
                        OR
                        (macd > 0 AND signal > 0 AND lag_macd < lag_signal AND macd > signal AND rsi BETWEEN 45 AND 70 AND (lag_histogram - hist_avg_20) / NULLIF(hist_std_20, 0) BETWEEN -1.5 AND 1)
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

        // 공통 쿼리 템플릿 (세부 전략명만 변경)
        const getQuery = (stratDtl: string) => `
            WITH picks AS(
                SELECT
                    reco_date,
                    stock_code,
                    stock_name
                FROM visual.vsl_inv_strat_picks_trend
                WHERE inv_strat_dtl='${stratDtl}'
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
                SELECT '눌림A',* FROM signal_base
                WHERE histogram>0
                  AND lag2_histogram>lag_histogram
                  AND lag_histogram<histogram
                  AND rsi BETWEEN 45 AND 70
                  AND z_score BETWEEN -1.5 AND 0.5
                UNION ALL  
                SELECT '눌림B',* FROM signal_base
                WHERE macd>0 AND signal>0
                  AND lag_macd<lag_signal
                  AND macd>signal
                  AND rsi BETWEEN 45 AND 70
                  AND z_score BETWEEN -1.5 AND 1
            )
            SELECT DISTINCT ON(s.date,s.stock_code)
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
            ORDER BY
                s.date DESC,
                s.stock_code;
        `

        const [res300, res500, res1000] = await Promise.all([
            pool.query(getQuery('종목별 개수(거래대금 300억 이상)'), [date]),
            pool.query(getQuery('종목별 개수(거래대금 500억 이상)'), [date]),
            pool.query(getQuery('종목별 개수(거래대금 1000억 이상)'), [date])
        ])

        return NextResponse.json({
            amount300: res300.rows || [],
            amount500: res500.rows || [],
            amount1000: res1000.rows || [],
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
