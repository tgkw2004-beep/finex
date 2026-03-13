import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.REMOTE_DB_URL,
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'search'

  try {
    if (mode === 'options') {
      // 필터용 옵션 목록 조회
      const years = await pool.query("SELECT DISTINCT SUBSTR(CAST(allocation_date AS TEXT), 1, 4) as val FROM company.seibro_div_list ORDER BY val DESC")
      const markets = await pool.query("SELECT DISTINCT market_type as val FROM company.seibro_div_list WHERE market_type IS NOT NULL")
      const stockTypes = await pool.query("SELECT DISTINCT RIGHT(stock_type, 3) as val FROM company.seibro_div_list WHERE stock_type IS NOT NULL")
      const industries = await pool.query("SELECT DISTINCT wics_name1 as val FROM company.master_company_list WHERE wics_name1 IS NOT NULL ORDER BY val")

      return NextResponse.json({
        years: years.rows.map(r => r.val),
        markets: markets.rows.map(r => r.val),
        stockTypes: stockTypes.rows.map(r => r.val),
        industries: industries.rows.map(r => r.val)
      })
    }

    // 검색 모드
    const year = searchParams.get('year') || 'ALL'
    const market = searchParams.get('market') || 'ALL'
    const stockType = searchParams.get('stockType') || 'ALL'
    const divFreq = searchParams.get('divFreq') || 'ALL'
    const industry = searchParams.get('industry') || 'ALL'
    const stockName = searchParams.get('stockName') || '' // 선택적 검색어

    let whereClauses = []
    let values: any[] = []
    let valIdx = 1

    if (year !== 'ALL') {
      whereClauses.push(`SUBSTR(CAST(sdl.allocation_date AS TEXT), 1, 4) = $${valIdx++}`)
      values.push(year)
    }
    if (market !== 'ALL') {
      whereClauses.push(`sdl.market_type = $${valIdx++}`)
      values.push(market)
    }
    if (stockType !== 'ALL') {
      whereClauses.push(`RIGHT(sdl.stock_type, 3) = $${valIdx++}`)
      values.push(stockType)
    }
    if (divFreq !== 'ALL') {
      whereClauses.push(`(CASE WHEN sdl.div_freq = 1 THEN '연' WHEN sdl.div_freq = 2 THEN '반기' WHEN sdl.div_freq IN (3,4,5) THEN '분기' ELSE '기타' END) = $${valIdx++}`)
      values.push(divFreq)
    }
    if (industry !== 'ALL') {
      whereClauses.push(`mcl.wics_name1 = $${valIdx++}`)
      values.push(industry)
    }
    if (stockName) {
      whereClauses.push(`sdl.stock_name LIKE $${valIdx++}`)
      values.push(`%${stockName}%`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const query = `
      WITH tmp AS ( 
       SELECT stock_code, COALESCE(SUM(dsp), 0) AS sumdsp
       FROM company.seibro_div_list
       GROUP BY stock_code
      ) 
      SELECT 
             SUBSTR(CAST(sdl.allocation_date AS TEXT), 1, 10) AS allocation_date, 
             SUBSTR(CAST(sdl.cash_date AS TEXT), 1, 10)       AS cash_date,
             SUBSTR(CAST(sdl.stock_date AS TEXT), 1, 10)      AS stock_date,
             sdl.stock_code                                   AS stock_code,
             sdl.stock_name                                   AS stock_name,
             mcl.wics_name1                                   AS industry_name,
             CASE WHEN sdl.div_freq = 1 THEN '연'
                  WHEN sdl.div_freq = 2 THEN '반기'
                  WHEN sdl.div_freq IN (3,4,5) THEN '분기' 
                  ELSE '기타' END                              AS div_freq_name, 
             sdl.market_type                                  AS market_type,
             sdl.dividend_type                                AS dividend_type,
             sdl.stock_type                                   AS stock_type,
             sdl.dsp                                          AS dsp,
             sdl.dsp_special                                  AS dsp_special,
             sdl.payout_ratio_cash                            AS payout_ratio_cash,
             sdl.payout_ratio_stock                           AS payout_ratio_stock,
             sdl.special_payout_cash                          AS special_payout_cash,
             sdl.special_payout_stock                         AS special_payout_stock,
             sdl.stock_dividend_ratio                         AS stock_dividend_ratio,
             sdl.special_stock_dividend_ratio                 AS special_stock_dividend_ratio,
             sdl.fractional_price                             AS fractional_price,
             sdl.face_value                                   AS face_value,
             sdl.fiscal_month                                 AS fiscal_month
      FROM company.seibro_div_list sdl
      INNER JOIN tmp ON tmp.stock_code = sdl.stock_code
      LEFT OUTER JOIN company.master_company_list mcl ON mcl.stock_code = sdl.stock_code 
      ${whereSql}
      ORDER BY tmp.sumdsp DESC,
               sdl.allocation_date DESC,
               sdl.dsp DESC,  
               sdl.stock_name
      LIMIT 1000;
    `

    const res = await pool.query(query, values)
    return NextResponse.json({ data: res.rows })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
