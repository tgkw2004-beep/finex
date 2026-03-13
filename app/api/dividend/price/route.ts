import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.REMOTE_DB_URL,
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'industry'
  const freq = searchParams.get('freq') || '분기' // '분기' or '월'
  const industry = searchParams.get('industry')

  try {
    let query = ''
    let values: any[] = []

    if (mode === 'industry') {
      // 1. 왼쪽 테이블: 산업별 요약 쿼리
      query = `
        WITH base_data AS (
          SELECT
            k.code,
            k.date,
            k.close,
            EXTRACT(YEAR FROM k.date) AS year,
            EXTRACT(MONTH FROM k.date) AS month
          FROM company.krx_stocks_ohlcv k
          WHERE EXTRACT(YEAR FROM k.date) = EXTRACT(YEAR FROM CURRENT_DATE)
        ),
        latest_price_data AS (
          SELECT code, MAX(date) AS latest_date
          FROM base_data
          GROUP BY code
        ),
        latest_price AS (
          SELECT b.code, b.close AS 전일주가
          FROM base_data b
          JOIN latest_price_data l ON b.code = l.code AND b.date = l.latest_date
        ),
        yearly_avg AS (
          SELECT code, AVG(close) AS 연평균주가
          FROM base_data
          GROUP BY code
        ),
        monthly_avg AS (
          SELECT
            code,
            EXTRACT(MONTH FROM date) AS 월,
            AVG(close) AS 평균주가
          FROM base_data
          GROUP BY code, EXTRACT(MONTH FROM date)
        ),
        latest_month_avg AS (
          SELECT ma.*
          FROM monthly_avg ma
          JOIN (
            SELECT code, MAX(월) AS 최근월
            FROM monthly_avg
            GROUP BY code
          ) lm ON ma.code = lm.code AND ma.월 = lm.최근월
        ),
        quarterly_avg AS (
          SELECT
            code,
            CASE
              WHEN month BETWEEN 1 AND 3 THEN 1
              WHEN month BETWEEN 4 AND 6 THEN 2
              WHEN month BETWEEN 7 AND 9 THEN 3
              ELSE 4
            END AS 분기,
            AVG(close) AS 평균주가
          FROM base_data
          GROUP BY code, 분기
        ),
        latest_quarter_avg AS (
          SELECT qa.*
          FROM quarterly_avg qa
          JOIN (
            SELECT code, MAX(분기) AS 최근분기
            FROM quarterly_avg
            GROUP BY code
          ) lq ON qa.code = lq.code AND qa.분기 = lq.최근분기
        ),
        dividend_data AS (
          SELECT *
          FROM company.seibro_div_detail
          WHERE stock_type = '보통주'
            AND payout_ratio IS NOT NULL 
            AND payout_ratio > 0
            AND dividend_yield_cash IS NOT NULL 
            AND dividend_yield_cash > 0
            AND CAST(SUBSTRING(report_date, 1, 4) AS INT) = 
                EXTRACT(YEAR FROM CURRENT_DATE) - (CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) < 5 THEN 2 ELSE 1 END)
        ),
        stock_summary AS (
          SELECT
            lp.code,
            lp.전일주가,
            ya.연평균주가,
            lq.평균주가 AS 최근분기평균주가,
            lm.평균주가 AS 최근월평균주가,
            sdd.dividend_yield_cash
          FROM latest_price lp
          JOIN yearly_avg ya ON lp.code = ya.code
          JOIN dividend_data sdd ON lp.code = sdd.stock_code 
          LEFT JOIN latest_quarter_avg lq ON lp.code = lq.code
          LEFT JOIN latest_month_avg lm ON lp.code = lm.code
        ),
        with_industry AS (
          SELECT
            mcl.wics_name1 AS 산업분류,
            ss.*
          FROM stock_summary ss
          JOIN (SELECT DISTINCT stock_code, wics_name1 FROM company.master_company_list) mcl ON ss.code = mcl.stock_code
        ),
        industry_avg AS (
          SELECT
            산업분류,
            AVG(연평균주가) AS 업종_연평균주가,
            AVG(최근분기평균주가) AS 업종_최근분기평균주가,
            AVG(최근월평균주가) AS 업종_최근월평균주가
          FROM with_industry
          GROUP BY 산업분류
        )
        SELECT
          wi.산업분류 as industry_name,
          COUNT(CASE WHEN 전일주가 <= 최근분기평균주가 AND 전일주가 <= 연평균주가 AND dividend_yield_cash >= 4 THEN 1 END) AS count_low_quarter,
          COUNT(CASE WHEN 전일주가 <= 최근월평균주가 AND 전일주가 <= 연평균주가 AND dividend_yield_cash >= 4 THEN 1 END) AS count_low_month,
          ROUND(ia.업종_연평균주가::numeric, 0) AS avg_price_year,
          ROUND(ia.업종_최근분기평균주가::numeric, 0) AS avg_price_quarter,
          ROUND(ia.업종_최근월평균주가::numeric, 0) AS avg_price_month
        FROM with_industry wi
        JOIN industry_avg ia ON wi.산업분류 = ia.산업분류
        GROUP BY wi.산업분류, ia.업종_연평균주가, ia.업종_최근분기평균주가, ia.업종_최근월평균주가
        ORDER BY count_low_quarter DESC;
      `
    } else {
      // 2. 오른쪽 테이블: 종목별 상세 쿼리
      query = `
        WITH base_data AS (
          SELECT
            code,
            date,
            close,
            EXTRACT(YEAR FROM date) AS year,
            EXTRACT(MONTH FROM date) AS month
          FROM company.krx_stocks_ohlcv
          WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
        ),
        latest_price_data AS (
          SELECT code, MAX(date) AS latest_date
          FROM base_data
          GROUP BY code
        ),
        latest_price AS (
          SELECT b.code, b.close
          FROM base_data b
          JOIN latest_price_data l ON b.code = l.code AND b.date = l.latest_date
        ),
        yearly_avg AS (
          SELECT code, AVG(close) AS avg_close_year
          FROM base_data
          GROUP BY code
        ),
        monthly_avg AS (
          SELECT
            code,
            TO_CHAR(date_trunc('month', date), 'MM월') AS 기준기간,
            EXTRACT(MONTH FROM date) AS 기간순번,
            AVG(close) AS 평균주가
          FROM base_data
          GROUP BY code, 기준기간, 기간순번
        ),
        latest_month_avg AS (
          SELECT ma.*, '월' AS 주기
          FROM monthly_avg ma
          WHERE (code, 기간순번) IN (
            SELECT code, MAX(기간순번)
            FROM monthly_avg
            GROUP BY code
          )
        ),
        quarterly_avg AS (
          SELECT
            code,
            CASE 
              WHEN month BETWEEN 1 AND 3 THEN '1~3월'
              WHEN month BETWEEN 4 AND 6 THEN '4~6월'
              WHEN month BETWEEN 7 AND 9 THEN '7~9월'
              ELSE '10~12월'
            END AS 기준기간,
            CASE 
              WHEN month BETWEEN 1 AND 3 THEN 1
              WHEN month BETWEEN 4 AND 6 THEN 2
              WHEN month BETWEEN 7 AND 9 THEN 3
              ELSE 4
            END AS 기간순번,
            AVG(close) AS 평균주가
          FROM base_data
          GROUP BY code, 기준기간, 기간순번
        ),
        latest_quarter_avg AS (
          SELECT qa.*, '분기' AS 주기
          FROM quarterly_avg qa
          WHERE (code, 기간순번) IN (
            SELECT code, MAX(기간순번)
            FROM quarterly_avg
            GROUP BY code
          )
        ),
        dividend_data AS (
          SELECT *
          FROM company.seibro_div_detail
          WHERE stock_type = '보통주'
            AND payout_ratio IS NOT NULL AND payout_ratio > 0
            AND dividend_yield_cash IS NOT NULL AND dividend_yield_cash > 0
            AND CAST(SUBSTR(report_date, 1, 4) AS INT) BETWEEN 
                CASE 
                    WHEN EXTRACT(MONTH FROM CURRENT_DATE) < 5 THEN EXTRACT(YEAR FROM CURRENT_DATE) - 4
                    ELSE EXTRACT(YEAR FROM CURRENT_DATE) - 3 
                END
                AND 
                CASE 
                    WHEN EXTRACT(MONTH FROM CURRENT_DATE) < 5 THEN EXTRACT(YEAR FROM CURRENT_DATE) - 2
                    ELSE EXTRACT(YEAR FROM CURRENT_DATE) - 1 
                END
        ),
        merged_avg AS (
          SELECT * FROM latest_month_avg
          UNION ALL
          SELECT * FROM latest_quarter_avg
        )
        SELECT
          sdd.stock_name AS stock_name,
          base.code AS stock_code,
          base.기준기간 AS period_name,
          ROUND(base.평균주가::numeric, 0) as avg_price_period,
          ROUND(ya.avg_close_year::numeric, 0) as avg_price_year,
          ROUND(lp.close::numeric, 0) as current_price,
          ROUND(sdd.dps::numeric, 0) as dps,
          sdd.dividend_yield_cash AS dividend_yield,
          sdd.payout_ratio AS payout_ratio,
          base.주기 as period_type
        FROM merged_avg base
        JOIN latest_price lp ON base.code = lp.code
        JOIN yearly_avg ya ON base.code = ya.code
        JOIN dividend_data sdd ON base.code = sdd.stock_code
        LEFT OUTER JOIN (SELECT DISTINCT stock_code, wics_name1 FROM company.master_company_list) mcl
          ON mcl.stock_code = base.code
        WHERE lp.close <= base.평균주가
          AND lp.close <= ya.avg_close_year
          AND base.주기 = $1
          AND mcl.wics_name1 = $2
          AND sdd.dividend_yield_cash >= 4
        ORDER BY sdd.dps DESC;
      `
      values = [freq, industry]
    }

    const res = await pool.query(query, values)
    return NextResponse.json({ data: res.rows })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
