import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const revalidate = 60

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await params

        // First, get the stock name from the symbol
        const kospiRes = await pool.query(`
            SELECT koreanname 
            FROM company.kis_kospi_info 
            WHERE shortcode = $1 
            LIMIT 1
        `, [symbol])

        let stockName = kospiRes.rows[0]?.koreanname

        // If not found in KOSPI, try KOSDAQ
        if (!stockName) {
            const kosdaqRes = await pool.query(`
                SELECT koreanname 
                FROM company.kis_kosdaq_info 
                WHERE shortcode = $1 
                LIMIT 1
            `, [symbol])
            stockName = kosdaqRes.rows[0]?.koreanname
        }

        if (!stockName) {
            console.log('Stock not found for symbol:', symbol)
            return NextResponse.json(
                { data: [], stockName: null },
                { status: 200 }
            )
        }

        // Calculate date range (last 30 days)
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)

        const formatDate = (d: any) => {
            if (!d) return '';
            if (typeof d === 'string') return d.split('T')[0];
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const startDateStr = formatDate(startDate)
        const endDateStr = formatDate(endDate)

        // Fetch investor trading data - use date range to optimize query
        const res = await pool.query(`
            SELECT date, investor, net_trade_vol 
            FROM company.krx_stocks_investor_shares_trading_info 
            WHERE name = $1 
              AND date >= $2 
              AND date <= $3 
            ORDER BY date DESC
        `, [stockName, startDateStr, endDateStr])

        const resultData = res.rows

        // Group by date and aggregate by investor type
        const groupedData: Record<string, any> = {}

        resultData.forEach((row) => {
            const dateStr = formatDate(row.date)

            if (!groupedData[dateStr]) {
                groupedData[dateStr] = {
                    일자: dateStr,
                    개인: 0,
                    외국인: 0,
                    기관합계: 0,
                    연기금: 0,
                    기타외국인: 0,
                    기타법인: 0,
                    투신: 0,
                    금융투자: 0,
                    보험: 0,
                    사모: 0,
                    은행: 0,
                    기타금융: 0,
                }
            }

            const investor = row.investor
            const netVol = parseFloat(row.net_trade_vol) || 0

            if (investor in groupedData[dateStr]) {
                groupedData[dateStr][investor] += netVol
            }
        })

        // Convert to array and sort by date descending, limit to 20
        const investorData = Object.values(groupedData)
            .sort((a: any, b: any) => b.일자.localeCompare(a.일자))
            .slice(0, 20)

        return NextResponse.json({
            data: investorData,
            stockName: stockName
        })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
