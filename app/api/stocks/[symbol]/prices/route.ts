import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { KrxStockOhlcv, StockPrice } from '@/types/stock'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await params
        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || 'D'
        const limit = parseInt(searchParams.get('limit') || '60')

        // Query stock price data from company.krx_stocks_ohlcv
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
                { error: 'No price data found' },
                { status: 404 }
            )
        }

        const formatDate = (d: any) => {
            if (!d) return '';
            if (typeof d === 'string') return d.split('T')[0];
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Transform to StockPrice format (reverse to get chronological order)
        const prices: StockPrice[] = priceData.reverse().map((row: any) => ({
            date: formatDate(row.date),
            open: Number(row.open),
            high: Number(row.high),
            low: Number(row.low),
            close: Number(row.close),
            volume: Number(row.volume),
        }))

        return NextResponse.json({ prices })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
