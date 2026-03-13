import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const getLatest = searchParams.get('latest')

        // 최신 데이터 날짜 조회
        if (getLatest === 'true') {
            const res = await pool.query(`
                SELECT MAX(date)::date::text AS date 
                FROM visual.vsl_bollinger_strategy
            `)

            return NextResponse.json({ latestDate: res.rows[0]?.date || null })
        }

        if (!date) {
            return NextResponse.json(
                { error: 'Date parameter is required' },
                { status: 400 }
            )
        }

        // 퀀트매수 전략 쿼리 (분류별)
        const query = `
            SELECT to_char(date, 'yyyy-mm-dd') as "일자"
                 , stock_name as "종목명"
                 , wics_name as "업종"
                 , open, high, low, close 
                 , Prime_L as "Prime-L"
                 , strategy as "전략"
              FROM visual.vsl_bollinger_strategy
             WHERE date = $1::date
            ORDER BY close DESC
        `
        
        const result = await pool.query(query, [date])
        const rows = result.rows || []

        // 전략별 분리
        const omegaR = rows.filter((r: any) => r['전략']?.toUpperCase() === 'OMEGA-R')
        const alphaS = rows.filter((r: any) => r['전략']?.toUpperCase() === 'ALPHA-S')
        const sigmaT = rows.filter((r: any) => r['전략']?.toUpperCase() === 'SIGMA-T')

        return NextResponse.json({
            omegaR,
            alphaS,
            sigmaT,
            date: date
        })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
