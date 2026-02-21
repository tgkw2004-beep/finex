import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const revalidate = 60

export async function GET() {
  try {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const dateString = oneYearAgo.toISOString().split('T')[0]

    // Parallelize queries for better performance
    const [kospiRes, kosdaqRes, majorIndicesRes] = await Promise.all([
      // KOSPI
      pool.query(`
        SELECT date, closing_price 
        FROM market.krx_stocks_kospi_index 
        WHERE date >= $1 
        ORDER BY date ASC
      `, [dateString]),

      // KOSDAQ
      pool.query(`
        SELECT date, closing_price 
        FROM market.krx_stocks_kosdaq_index 
        WHERE date >= $1 
        ORDER BY date ASC
      `, [dateString]),

      // Major Indices (SPX, COMP, .DJI)
      pool.query(`
        SELECT date, close, code 
        FROM market.kis_major_market_index 
        WHERE date >= $1 AND code IN ('SPX', 'COMP', '.DJI')
        ORDER BY date ASC
      `, [dateString])
    ])

    // Process Major Indices into separate arrays
    // pg returns dates as Date objects, we need to convert them to YYYY-MM-DD strings
    const formatRows = (rows: any[]) => rows.map(r => ({
      ...r,
      date: typeof r.date === 'string' ? r.date : r.date.toISOString().split('T')[0]
    }));

    const majorData = formatRows(majorIndicesRes.rows);
    const spxData = majorData.filter((item: any) => item.code === 'SPX') || []
    const compData = majorData.filter((item: any) => item.code === 'COMP') || []
    const djiData = majorData.filter((item: any) => item.code === '.DJI') || []

    return NextResponse.json({
      kospi: formatRows(kospiRes.rows) || [],
      kosdaq: formatRows(kosdaqRes.rows) || [],
      spx: spxData,
      comp: compData,
      dji: djiData
    })

  } catch (error) {
    console.error('Market Indices API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market indices' },
      { status: 500 }
    )
  }
}
