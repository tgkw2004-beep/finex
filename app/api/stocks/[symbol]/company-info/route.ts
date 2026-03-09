import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params

    // 1. Get info from kis_kospi_info or kis_kosdaq_info
    const kospiRes = await pool.query(`SELECT * FROM company.kis_kospi_info WHERE shortcode = $1 LIMIT 1`, [symbol])
    const kosdaqRes = await pool.query(`SELECT * FROM company.kis_kosdaq_info WHERE shortcode = $1 LIMIT 1`, [symbol])
    const info = kospiRes.rows[0] || kosdaqRes.rows[0]

    if (!info) {
      return NextResponse.json({
        한글명: '',
        업종: '',
        대분류: '',
        중분류: '',
        소분류: '',
        테마: '',
        상장일자: '',
        액면가: '',
        상장주식수: '0',
        자본금: '',
        시가총액: '',
        '52주최저가': '',
        '52주최고가': ''
      })
    }

    // 2. Get fundamental info for WICS classification
    const fundRes = await pool.query(`
      SELECT wics_name1, wics_name2, wics_name3 
      FROM visual.vsl_krx_stocks_fundamental_info 
      WHERE stock_code = $1 
      ORDER BY date DESC LIMIT 1
    `, [symbol])
    const fundData = fundRes.rows[0]

    // 3. Get market cap
    const capRes = await pool.query(`
      SELECT cap, number_shares 
      FROM company.krx_stocks_cap 
      WHERE code = $1 
      ORDER BY date DESC LIMIT 1
    `, [symbol])
    const capData = capRes.rows[0]

    // 4. Get themes
    const themeRes = await pool.query(`
      SELECT theme_name 
      FROM company.kis_theme_code 
      WHERE stock_code = $1
    `, [symbol])
    const themeList = themeRes.rows?.map(t => t.theme_name).join(', ') || '-'

    // 5. Get 52-week high/low
    const priceRes = await pool.query(`
      SELECT low, high 
      FROM company.krx_stocks_ohlcv 
      WHERE code = $1 
      ORDER BY date DESC LIMIT 260
    `, [symbol])
    const priceData = priceRes.rows

    let min52 = 0
    let max52 = 0
    if (priceData && priceData.length > 0) {
      min52 = Math.min(...priceData.map(p => parseFloat(p.low) || 0))
      max52 = Math.max(...priceData.map(p => parseFloat(p.high) || 0))
    }

    // Format capital stock
    const capitalstock = info.capitalstock || 0
    const capitalTrillion = Math.floor(capitalstock / 1000000000000)
    const capitalBillion = Math.floor((capitalstock % 1000000000000) / 100000000)
    let capitalFormatted = ''
    if (capitalTrillion > 0) capitalFormatted += `${capitalTrillion}조 `
    if (capitalBillion > 0) capitalFormatted += `${capitalBillion}억`

    // Format market cap
    const cap = capData?.cap || 0
    const capTrillion = Math.floor(cap / 1000000000000)
    const capBillion = Math.floor((cap % 1000000000000) / 100000000)
    let capFormatted = ''
    if (capTrillion > 0) capFormatted += `${capTrillion}조 `
    if (capBillion > 0) capFormatted += `${capBillion}억`

    return NextResponse.json({
      한글명: info.koreanname || '',
      업종: info.indutyname || '',
      대분류: fundData?.wics_name1 || '',
      중분류: fundData?.wics_name2 || '',
      소분류: fundData?.wics_name3 || '',
      테마: themeList,
      상장일자: info.listingdate ? (typeof info.listingdate === 'string' ? info.listingdate : new Date(info.listingdate).toISOString().split('T')[0]) : '',
      액면가: info.parvalue ? `${parseFloat(info.parvalue).toLocaleString()}원` : '',
      상장주식수: capData?.number_shares ? parseFloat(capData.number_shares).toLocaleString() : '0',
      자본금: capitalFormatted,
      시가총액: capFormatted,
      '52주최저가': min52 > 0 ? `${min52.toLocaleString()}원` : '',
      '52주최고가': max52 > 0 ? `${max52.toLocaleString()}원` : ''
    })
  } catch (error) {
    console.error('Error fetching company info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
