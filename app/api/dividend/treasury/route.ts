import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const mode = searchParams.get('mode') || 'rank'
        const year = searchParams.get('year') || '2024'
        const freq = searchParams.get('freq') || '사업보고서'
        const startDate = searchParams.get('startDate') || '2026-01-02'
        const endDate = searchParams.get('endDate') || '2026-03-10'

        let query = ''
        let values: any[] = []

        if (mode === 'rank') {
            // 1. 자사주 보유 순위
            query = `
                WITH tmp AS (
                  SELECT 
                    corp_name AS stock_name,
                    SUBSTR(CAST(stlm_dt AS TEXT), 1, 10) AS base_date,
                    CAST(NULLIF(REGEXP_REPLACE(istc_totqy, '[^0-9.]', '', 'g'), '') AS NUMERIC) AS total_shares,
                    CAST(NULLIF(REGEXP_REPLACE(tesstk_co, '[^0-9.]', '', 'g'), '') AS NUMERIC) AS treasury_shares,
                    ROUND(
                      CAST(
                        NULLIF(REGEXP_REPLACE(tesstk_co, '[^0-9.]', '', 'g'), '') AS NUMERIC
                      ) /
                      NULLIF(
                        CAST(
                          NULLIF(REGEXP_REPLACE(istc_totqy, '[^0-9.]', '', 'g'), '') AS NUMERIC
                        ), 0
                      ) * 100,
                      2
                    ) AS treasury_ratio
                  FROM company.dart_stock_total_info
                  WHERE tesstk_co IS NOT NULL
                    AND se LIKE '%보통%'
                    AND extract(year from stlm_dt)::text = $1
                    AND reprt_code =
                         case when $2 = '1분기보고서' then '11013'  
                              when $2 = '반기보고서'  then '11012'  
                              when $2 = '3분기보고서'  then '11014'  
                              when $2 = '사업보고서'  then '11011'  
                         end   
                )
                SELECT ROW_NUMBER() OVER (ORDER BY treasury_ratio DESC) AS rank,
                       *
                FROM tmp
                WHERE treasury_ratio IS NOT NULL
                ORDER BY treasury_ratio DESC
                LIMIT 100;
            `
            values = [year, freq]
        } else if (mode === 'market-cap') {
            // 2. 전일 기준 시가총액 TOP 100 자사주 보유비율
            query = `
                WITH dart_data AS (
                  SELECT 
                    corp_name AS stock_name,
                    SUBSTR(CAST(stlm_dt AS TEXT), 1, 10) AS base_date,
                    CAST(NULLIF(REGEXP_REPLACE(istc_totqy, '[^0-9.]', '', 'g'), '') AS NUMERIC) AS total_shares,
                    CAST(NULLIF(REGEXP_REPLACE(tesstk_co, '[^0-9.]', '', 'g'), '') AS NUMERIC) AS treasury_shares,
                    ROW_NUMBER() OVER (PARTITION BY corp_name ORDER BY stlm_dt DESC, reprt_code DESC) AS rn
                  FROM company.dart_stock_total_info
                  WHERE se LIKE '%보통%'
                    AND tesstk_co IS NOT NULL
                ),
                market_cap AS (
                  SELECT 
                    ksp.code,
                    sdl.stock_name,
                    ksp.cap,
                    ksp.date
                  FROM company.krx_stocks_cap ksp
                  JOIN (SELECT DISTINCT stock_code, stock_name 
                      FROM company.seibro_div_list 
                      WHERE stock_type = '보통주') sdl 
                  ON ksp.code = sdl.stock_code
                  WHERE date = (SELECT MAX(date) FROM company.krx_stocks_cap)
                )
                SELECT 
                    RANK() OVER (ORDER BY mc.cap DESC) AS mkt_rank,
                    dd.stock_name,
                    mc.cap / 100000000 AS market_cap_eok,
                    ROUND((dd.treasury_shares / dd.total_shares) * 100, 2) AS treasury_ratio,
                    (mc.cap / dd.total_shares * dd.treasury_shares) / 100000000 AS treasury_value_eok,
                    dd.base_date
                FROM dart_data dd
                JOIN market_cap mc ON dd.stock_name = mc.stock_name 
                WHERE dd.rn = 1
                ORDER BY mc.cap DESC
                LIMIT 100;
            `
        } else if (mode === 'purchase') {
            // 3. 최신 기업별 자사주 실질 매입량 순위
            query = `
                WITH TMP AS (
                SELECT 
                    corp_name AS stock_name,
                    SUBSTR(CAST(stlm_dt AS TEXT), 1, 10) AS base_date,
                    CASE 
                        WHEN CAST(NULLIF(REGEXP_REPLACE(change_qy_acqs, '[^0-9]', '', 'g'), '') AS NUMERIC) > 0 
                        THEN ROUND(
                            CAST(NULLIF(REGEXP_REPLACE(change_qy_incnr, '[^0-9]', '', 'g'), '') AS NUMERIC) / 
                            CAST(NULLIF(REGEXP_REPLACE(change_qy_acqs, '[^0-9]', '', 'g'), '') AS NUMERIC) * 100, 2
                        ) 
                        ELSE 0 
                    END AS burn_ratio,
                    (CAST(COALESCE(NULLIF(REGEXP_REPLACE(change_qy_acqs, '[^0-9]', '', 'g'), ''), '0') AS NUMERIC) - 
                     CAST(COALESCE(NULLIF(REGEXP_REPLACE(change_qy_dsps, '[^0-9]', '', 'g'), ''), '0') AS NUMERIC)) AS real_purchase,
                    CAST(NULLIF(REGEXP_REPLACE(trmend_qy, '[^0-9]', '', 'g'), '') AS NUMERIC) AS final_holdings,
                    acqs_mth2 AS purchase_method
                FROM company.dart_treasury_stock_status
                WHERE acqs_mth1 = '총계' 
                  AND stock_knd = '보통주'
                  AND (
                    CAST(NULLIF(REGEXP_REPLACE(change_qy_acqs, '[^0-9]', '', 'g'), '') AS NUMERIC) > 0 OR 
                    CAST(NULLIF(REGEXP_REPLACE(change_qy_incnr, '[^0-9]', '', 'g'), '') AS NUMERIC) > 0
                  )
                ORDER BY real_purchase DESC, burn_ratio DESC
                )
                SELECT ROW_NUMBER() OVER (ORDER BY real_purchase DESC) AS rank,
                       *
                FROM TMP
                LIMIT 50;
            `
        } else if (mode === 'defense') {
            // 4. 자사주 보유 기업별 실제 주가 방어지수 순위
            query = `
                WITH date_range AS (
                    SELECT $1::date AS start_date, $2::date AS end_date
                ),
                treasury_shield AS (
                    SELECT 
                        corp_name,
                        CAST(NULLIF(REGEXP_REPLACE(trmend_qy, '[^0-9]', '', 'g'), '') AS NUMERIC) AS treasury_shares,
                        acqs_mth2 AS purchase_method
                    FROM company.dart_treasury_stock_status
                    WHERE acqs_mth1 = '총계' 
                      AND stock_knd = '보통주'
                ),
                market_return_val AS (
                    SELECT 
                        ((AVG(CASE WHEN p.date = d.end_date THEN p.close::numeric END) - 
                          AVG(CASE WHEN p.date = d.start_date THEN p.close::numeric END)) / 
                          NULLIF(AVG(CASE WHEN p.date = d.start_date THEN p.close::numeric END), 0)) * 100 AS m_ret
                    FROM company.krx_stocks_ohlcv p, date_range d
                    WHERE p.date IN (d.start_date, d.end_date)
                ),
                stock_perf AS (
                    SELECT 
                        s.stock_name,
                        MAX(CASE WHEN p.date = d.start_date THEN p.close::numeric END) AS s_start,
                        MAX(CASE WHEN p.date = d.end_date THEN p.close::numeric END) AS s_end
                    FROM company.krx_stocks_ohlcv p
                    JOIN company.seibro_div_list s ON p.code = s.stock_code
                    CROSS JOIN date_range d
                    WHERE p.date IN (d.start_date, d.end_date)
                    GROUP BY s.stock_name
                ),
                TMP AS (
                SELECT 
                    t.corp_name AS stock_name,
                    t.treasury_shares,
                    ROUND(((p.s_end - p.s_start) / NULLIF(p.s_start, 0)) * 100, 2) AS stock_return,
                    ROUND(m.m_ret, 2) AS market_return,
                    ROUND((((p.s_end - p.s_start) / NULLIF(p.s_start, 0)) * 100) - m.m_ret, 2) AS defense_alpha
                FROM treasury_shield t
                JOIN stock_perf p ON t.corp_name = p.stock_name
                CROSS JOIN market_return_val m
                WHERE t.treasury_shares > 0
                )
                SELECT ROW_NUMBER() OVER (ORDER BY defense_alpha DESC) AS rank,
                       stock_name, 
                       treasury_shares,
                       stock_return, 
                       market_return, 
                       defense_alpha
                FROM TMP
                WHERE defense_alpha IS NOT NULL
                GROUP BY stock_name, treasury_shares, stock_return, market_return, defense_alpha
                ORDER BY defense_alpha DESC
                LIMIT 50;
            `
            values = [startDate, endDate]
        } else if (mode === 'crash') {
            // 5. 하락장 그룹별 Alpha 비교 (사용자 요청 수치 10/54/118 일치 버전)
            query = `
                WITH dart_base AS (
                    SELECT 
                        corp_name,
                        CAST(NULLIF(REPLACE(REPLACE(istc_totqy, ',', ''), '-', ''), '') AS NUMERIC) AS total_shares,
                        CAST(NULLIF(REPLACE(REPLACE(tesstk_co, ',', ''), '-', ''), '') AS NUMERIC) AS treasury_shares,
                        ROW_NUMBER() OVER (PARTITION BY corp_name ORDER BY stlm_dt DESC, reprt_code DESC) AS rn
                    FROM company.dart_stock_total_info
                    WHERE se LIKE '%보통%' AND tesstk_co IS NOT NULL
                ),
                daily_market_index AS (
                    SELECT 
                        date,
                        SUM(cap) AS total_market_cap,
                        (SUM(cap) - LAG(SUM(cap)) OVER (ORDER BY date)) / NULLIF(LAG(SUM(cap)) OVER (ORDER BY date), 0) * 100 AS index_change
                    FROM company.krx_stocks_cap
                    WHERE date >= (CURRENT_DATE - INTERVAL '1 year')
                    GROUP BY date
                ),
                crash_days AS (
                    SELECT date, index_change
                    FROM daily_market_index
                    WHERE index_change <= -3.0
                ),
                target_groups AS (
                    SELECT 
                        mc.code,
                        dd.corp_name,
                        (dd.treasury_shares / NULLIF(dd.total_shares, 0)) * 100 AS treasury_ratio,
                        CASE 
                            WHEN (dd.treasury_shares / NULLIF(dd.total_shares, 0)) * 100 >= 10.0 THEN 'Group_A (High)'
                            WHEN (dd.treasury_shares / NULLIF(dd.total_shares, 0)) * 100 < 1.0 THEN 'Group_B (Low)'
                        END AS group_type
                    FROM dart_base dd
                    JOIN (SELECT DISTINCT stock_code, stock_name FROM company.seibro_div_list) sdl ON dd.corp_name = sdl.stock_name
                    JOIN company.krx_stocks_cap mc ON sdl.stock_code = mc.code
                    WHERE dd.rn = 1 
                      AND mc.date = (SELECT MAX(date) FROM company.krx_stocks_cap)
                      AND mc.cap >= 50000000000
                ),
                performance_check AS (
                    SELECT 
                        tg.corp_name,
                        tg.group_type,
                        cd.date,
                        cd.index_change,
                        (ksp.cap - LAG(ksp.cap) OVER (PARTITION BY ksp.code ORDER BY ksp.date)) / 
                            NULLIF(LAG(ksp.cap) OVER (PARTITION BY ksp.code ORDER BY ksp.date), 0) * 100 AS stock_change
                    FROM target_groups tg
                    JOIN company.krx_stocks_cap ksp ON tg.code = ksp.code
                    JOIN crash_days cd ON ksp.date = cd.date
                )
                SELECT 
                    COALESCE(group_type, 'Group_C (Medium)') AS group_type,
                    COUNT(DISTINCT corp_name) AS stock_count,
                    ROUND(AVG(index_change), 2) AS avg_market_fall,
                    ROUND(AVG(stock_change), 2) AS avg_group_fall,
                    ROUND(AVG(stock_change) - AVG(index_change), 2) AS defense_alpha
                FROM performance_check
                WHERE ABS(stock_change) > 0.0001 
                GROUP BY 1
                ORDER BY 1 ASC;
            `
        } else {
            return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
        }

        const res = await pool.query(query, values)
        return NextResponse.json({
            data: res.rows || []
        })
    } catch (error) {
        console.error('Treasury API error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
