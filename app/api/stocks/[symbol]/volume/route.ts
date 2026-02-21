import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { symbol: string } }
) {
    try {
        const { symbol } = params
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '60')

        // Query stock price data for volume information
        const res = await pool.query(`
            SELECT * 
            FROM company.krx_stocks_ohlcv 
            WHERE code = $1 
            ORDER BY date DESC 
            LIMIT $2
        `, [symbol, limit])

        const priceData = res.rows

        if (!priceData || priceData.length === 0) {
            return NextResponse.json(
                { error: 'No volume data found' },
                { status: 404 }
            )
        }

        // Calculate volume statistics
        const volumes = priceData.map(d => Number(d.volume))
        const avgVolume = volumes.length > 0
            ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length)
            : 0

        const formatDate = (d: any) => {
            if (!d) return '';
            if (typeof d === 'string') return d.split('T')[0];
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const latest = priceData[0]
        const volumeData = {
            currentVolume: Number(latest.volume),
            avgVolume5Day: avgVolume,
            tradingValue: Number(latest.trade_value),
            changeRate: Number(latest.change_rate),
            history: priceData.reverse().map(d => ({
                date: formatDate(d.date),
                volume: Number(d.volume),
                close: Number(d.close),
                tradingValue: Number(d.trade_value),
            }))
        }

        return NextResponse.json({ volumeData })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
