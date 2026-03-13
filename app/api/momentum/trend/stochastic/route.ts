import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.REMOTE_DB_URL,
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'immediate' // 'immediate' or 'inflection'

  try {
    let query = ''
    
    if (type === 'immediate') {
      // 1. 즉각적인 매수 타점
      query = `
        WITH date_master AS (
            SELECT date, ROW_NUMBER() OVER (ORDER BY date) AS date_idx
            FROM (
                SELECT DISTINCT date FROM company.krx_stocks_ohlcv WHERE date >= CURRENT_DATE - INTERVAL '6 month'
            ) AS d
        ),
        tmp00 AS (
            SELECT date, stock_code, stock_name, macd, signal, rsi
            FROM visual.vsl_anly_stocks_price_subindex02
            WHERE date >= CURRENT_DATE - INTERVAL '6 month'
        ),
        tmp01 AS (
            SELECT date, stock_code, stock_name, macd, signal, rsi,
                   (macd - signal) AS hist,
                   LAG(macd - signal, 1) OVER (PARTITION BY stock_code ORDER BY date) AS hist_prev1,
                   LAG(macd - signal, 2) OVER (PARTITION BY stock_code ORDER BY date) AS hist_prev2,
                   LAG(macd - signal, 10) OVER (PARTITION BY stock_code ORDER BY date) AS hist_prev10
            FROM tmp00
        ),
        tmp02 AS (
            SELECT t.*, dm.date_idx,
                   AVG(t.hist) OVER (PARTITION BY t.stock_code ORDER BY t.date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_avg_20,
                   STDDEV(t.hist) OVER (PARTITION BY t.stock_code ORDER BY t.date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) AS hist_std_20,
                   MIN(t.hist) OVER (PARTITION BY t.stock_code ORDER BY t.date ROWS BETWEEN 14 PRECEDING AND 1 PRECEDING) AS hist_lowest,
                   MAX(t.hist_prev10) OVER (PARTITION BY t.stock_code ORDER BY t.date ROWS BETWEEN 60 PRECEDING AND 1 PRECEDING) AS max_hist_past
            FROM tmp01 t
            JOIN date_master dm ON t.date = dm.date
        ),
        tmp03 AS (
            SELECT *, ROUND((hist_prev1 - hist_avg_20) / NULLIF(hist_std_20, 0), 2) AS z_score
            FROM tmp02
            WHERE hist < 0
              AND hist_prev2 > hist_prev1
              AND hist_prev1 < hist
              AND rsi BETWEEN 25 AND 70
              AND (hist_prev1 - hist_avg_20) / NULLIF(hist_std_20, 0) <= -1.5
              AND max_hist_past > 0 
              AND max_hist_past >= hist_lowest * 1.2
        ),
        tmp_swing AS (
            SELECT t.reco_date, t.stock_code, t.stock_name, t.close, dm.date_idx AS reco_idx
            FROM visual.vsl_inv_strat_picks_trend t
            JOIN date_master dm ON t.reco_date = dm.date
            WHERE t.reco_date >= CURRENT_DATE - INTERVAL '3 month'
              AND t.inv_strat = '스토캐스틱'
              AND t.inv_strat_dtl = '스토캐스틱단기(5,3) 및 거래대금top300'
        ),
        tmp_fscore AS (
            SELECT code, f_score
            FROM (
                SELECT code, f_score,
                       ROW_NUMBER() OVER (PARTITION BY code ORDER BY bsns_year DESC, 
                       CASE reprt_code WHEN '11014' THEN 4 WHEN '11011' THEN 3 WHEN '11012' THEN 2 WHEN '11013' THEN 1 ELSE 0 END DESC) AS rn
                FROM company.dart_fs_fscore
            ) a WHERE rn = 1
        )
        SELECT DISTINCT
               TO_CHAR(sig.date, 'yyyy-mm-dd') AS reco_date,
               sig.stock_name,
               sig.stock_code,
               CASE 
                 WHEN kpi.shortcode IS NOT NULL THEN 'KOSPI'
                 WHEN kdi.shortcode IS NOT NULL THEN 'KOSDAQ'
                 ELSE ''
               END AS market_type,
               vsl.wics_name AS industry_name,
               fs.f_score
        FROM (
            SELECT s.date, s.stock_code, s.stock_name, o.close
            FROM tmp03 s
            INNER JOIN tmp_swing sw ON s.stock_code = sw.stock_code
            INNER JOIN company.krx_stocks_ohlcv o ON s.stock_code = o.code AND s.date = o.date
            WHERE s.date_idx >= sw.reco_idx 
              AND s.date_idx <= sw.reco_idx + 5
        ) sig
        LEFT JOIN (SELECT DISTINCT shortcode FROM company.kis_kospi_info) kpi ON sig.stock_code = kpi.shortcode
        LEFT JOIN (SELECT DISTINCT shortcode FROM company.kis_kosdaq_info) kdi ON sig.stock_code = kdi.shortcode
        LEFT JOIN (SELECT DISTINCT stock_code, wics_name, date FROM visual.vsl_anly_stocks_price_subindex01) vsl 
            ON sig.stock_code = vsl.stock_code AND sig.date = vsl.date
        LEFT JOIN tmp_fscore fs ON sig.stock_code = fs.code
        ORDER BY reco_date DESC;
      `
    } else {
      // 2. 대추세의 변곡점 탈출
      query = `
        WITH date_master AS (
            SELECT date, ROW_NUMBER() OVER (ORDER BY date) as date_idx
            FROM (SELECT DISTINCT date FROM company.krx_stocks_ohlcv WHERE date >= CURRENT_DATE - INTERVAL '6 month') AS d
        ),
        tmp00 AS (
            SELECT date, stock_code, stock_name, macd, signal, rsi, (macd - signal) AS hist
            FROM visual.vsl_anly_stocks_price_subindex02
            WHERE date >= CURRENT_DATE - INTERVAL '6 month'
        ),
        tmp01 AS (
            SELECT date, stock_code, stock_name, rsi, hist, macd, signal,
                   LAG(macd) OVER (PARTITION BY stock_code ORDER BY date) as lag_macd,
                   LAG(signal) OVER (PARTITION BY stock_code ORDER BY date) as lag_signal
            FROM tmp00
        ),
        tmp_signals AS (
            SELECT s.*, dm.date_idx
            FROM tmp01 s
            JOIN date_master dm ON s.date = dm.date
            WHERE s.lag_macd < s.lag_signal AND s.macd > s.signal
              AND s.rsi >= 30
        ),
        tmp_swing AS (
            SELECT t.reco_date, t.stock_code, t.stock_name, dm.date_idx as reco_idx
            FROM visual.vsl_inv_strat_picks_trend t
            JOIN date_master dm ON t.reco_date = dm.date
            WHERE t.reco_date >= CURRENT_DATE - INTERVAL '3 month'
              AND t.inv_strat = '스토캐스틱'
              AND t.inv_strat_dtl = '스토캐스틱장기(20,12) 및 거래대금top300'
        ),
        tmp_fscore AS (
            SELECT code, f_score
            FROM (
                SELECT code, f_score,
                       ROW_NUMBER() OVER (PARTITION BY code ORDER BY bsns_year DESC, 
                       CASE reprt_code WHEN '11014' THEN 4 WHEN '11011' THEN 3 WHEN '11012' THEN 2 WHEN '11013' THEN 1 ELSE 0 END DESC) as rn
                FROM company.dart_fs_fscore
            ) a WHERE rn = 1
        )
        SELECT TO_CHAR(sig.date, 'yyyy-mm-dd') AS reco_date,
               sig.stock_name,
               sig.stock_code,
               CASE 
                WHEN kpi.shortcode IS NOT NULL THEN 'KOSPI'
                WHEN kdi.shortcode IS NOT NULL THEN 'KOSDAQ'
                ELSE ''
               END AS market_type,
               vsl.wics_name AS industry_name,
               fs.f_score
        FROM tmp_signals sig
        INNER JOIN tmp_swing sw ON sig.stock_code = sw.stock_code AND sig.date_idx BETWEEN sw.reco_idx AND sw.reco_idx + 5
        LEFT JOIN (SELECT DISTINCT shortcode FROM company.kis_kospi_info) kpi ON sig.stock_code = kpi.shortcode
        LEFT JOIN (SELECT DISTINCT shortcode FROM company.kis_kosdaq_info) kdi ON sig.stock_code = kdi.shortcode
        LEFT JOIN visual.vsl_anly_stocks_price_subindex01 vsl ON sig.stock_code = vsl.stock_code AND sig.date = vsl.date
        LEFT JOIN tmp_fscore fs ON sig.stock_code = fs.code
        ORDER BY reco_date DESC;
      `
    }

    const res = await pool.query(query)
    return NextResponse.json({ data: res.rows })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
