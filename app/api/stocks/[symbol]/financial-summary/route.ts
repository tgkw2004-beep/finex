import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const revalidate = 60

export async function GET(
    request: NextRequest,
    { params }: { params: { symbol: string } }
) {
    try {
        const { symbol } = await params

        // 1. Get info from kis_kospi_info or kis_kosdaq_info
        const kospiRes = await pool.query(`
            SELECT * 
            FROM company.kis_kospi_info 
            WHERE shortcode = $1 
            ORDER BY referenceyearmonth DESC 
            LIMIT 1
        `, [symbol])

        const kosdaqRes = await pool.query(`
            SELECT * 
            FROM company.kis_kosdaq_info 
            WHERE shortcode = $1 
            ORDER BY referenceyearmonth DESC 
            LIMIT 1
        `, [symbol])

        const info = kospiRes.rows[0] || kosdaqRes.rows[0]

        if (!info) {
            console.log('No info found for symbol:', symbol)
            return NextResponse.json({ years: [], data: [] })
        }

        // 2. Get fundamental info
        const fundRes = await pool.query(`
            SELECT * 
            FROM company.krx_stocks_fundamental_info 
            WHERE code = $1 
            ORDER BY date DESC 
            LIMIT 1
        `, [symbol])
        const fundData = fundRes.rows[0]

        // 3. Get latest closing price
        const priceRes = await pool.query(`
            SELECT close 
            FROM company.krx_stocks_ohlcv 
            WHERE code = $1 
            ORDER BY date DESC 
            LIMIT 1
        `, [symbol])
        const priceData = priceRes.rows[0]

        const close = priceData?.close || 0

        // Format sales
        const sales = parseFloat(info.sales) || 0
        const salesSign = sales < 0 ? '-' : ''
        const absSales = Math.abs(sales)
        const salesTrillion = Math.floor(absSales / 10000)
        const salesBillion = Math.floor(absSales % 10000)
        let salesFormatted = salesSign
        if (salesTrillion > 0) salesFormatted += `${salesTrillion}조 `
        if (salesBillion > 0) salesFormatted += `${salesBillion}억`

        // Format operating profit
        const operatingProfit = parseFloat(info.operatingprofit) || 0
        const opSign = operatingProfit < 0 ? '-' : ''
        const absOp = Math.abs(operatingProfit)
        const opTrillion = Math.floor(absOp / 10000)
        const opBillion = Math.floor(absOp % 10000)
        let opFormatted = opSign
        if (opTrillion > 0) opFormatted += `${opTrillion}조 `
        if (opBillion > 0) opFormatted += `${opBillion}억`

        // Format net income
        const netIncome = parseFloat(info.netincome) || 0
        const netSign = netIncome < 0 ? '-' : ''
        const absNet = Math.abs(netIncome)
        const netTrillion = Math.floor(absNet / 10000)
        const netBillion = Math.floor(absNet % 10000)
        let netFormatted = netSign
        if (netTrillion > 0) netFormatted += `${netTrillion}조 `
        if (netBillion > 0) netFormatted += `${netBillion}억`

        // Calculate ratios
        const operatingMargin = sales !== 0 ? ((operatingProfit * 100.0) / sales).toFixed(2) : '0.00'
        const netMargin = sales !== 0 ? ((netIncome * 100.0) / sales).toFixed(2) : '0.00'
        const pbr = fundData?.bps ? (close / fundData.bps).toFixed(2) : '0.00'

        const refYearMonth = info.referenceyearmonth?.toString() || ''
        const year = refYearMonth.substring(0, 4)
        const refFormatted = refYearMonth ? `${refYearMonth.substring(0, 4)}.${refYearMonth.substring(4, 6)}` : ''

        const yearData = {
            year,
            yearMonth: refFormatted,
            매출액: salesFormatted,
            영업이익: opFormatted,
            당기순이익: netFormatted,
            영업이익률: `${operatingMargin}%`,
            순이익률: `${netMargin}%`,
            ROE: `${(parseFloat(info.roe) || 0).toFixed(2)}%`,
            EPS: fundData?.eps ? `${Math.floor(parseFloat(fundData.eps)).toLocaleString()}원` : '0원',
            PER: `${(parseFloat(fundData?.per) || 0).toFixed(2)}배`,
            BPS: fundData?.bps ? `${Math.floor(parseFloat(fundData.bps)).toLocaleString()}원` : '0원',
            PBR: `${pbr}배`,
            주당배당금: fundData?.dps ? `${Math.floor(parseFloat(fundData.dps)).toLocaleString()}원` : '0원',
            배당수익률: `${(parseFloat(fundData?.div) || 0).toFixed(2)}%`
        }

        return NextResponse.json({ years: [year], data: [yearData] })
    } catch (error) {
        console.error('Error fetching financial summary:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
