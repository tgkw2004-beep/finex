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
                SELECT MAX(reco_date)::date::text AS date 
                FROM visual.vsl_inv_strat_picks_swing 
                WHERE inv_strat_dtl IN ('징검다리전략대표종목1', '징검다리전략대표종목2')
            `)

            return NextResponse.json({ latestDate: res.rows[0]?.date || null })
        }

        // Stats mode for calendar counts
        const getStats = searchParams.get('stats')
        if (getStats === 'true') {
            const res = await pool.query(`
                SELECT to_char(date, 'yyyy-MM-dd') as date
                     , count(*) as count
                FROM (
                    SELECT DISTINCT ON (reco_date, stock_code, inv_strat_dtl)
                        reco_date as date, stock_code
                    FROM visual.vsl_inv_strat_picks_swing
                    WHERE inv_strat_dtl IN ('징검다리전략대표종목1', '징검다리전략대표종목2')
                      AND info2 IS NOT NULL
                ) as final
                GROUP BY date
                ORDER BY date DESC
            `)
            
            const statsMap = res.rows.reduce((acc: any, row: any) => {
                acc[row.date] = parseInt(row.count)
                return acc
            }, {})

            return NextResponse.json({ stats: statsMap })
        }

        if (!date) {
            return NextResponse.json(
                { error: 'Date parameter is required' },
                { status: 400 }
            )
        }

        // 징검다리전략A (전략대표종목1)
        const queryA = `
            SELECT TO_CHAR(reco_date, 'yyyy-MM-dd') AS "일자"
                  ,info1 AS "업종명"
                  ,info2 as "시장구분명"
                  ,stock_name as "종목명"
                  ,stock_code as "종목코드"
            FROM visual.vsl_inv_strat_picks_swing
            WHERE inv_strat_dtl = '징검다리전략대표종목1'
            AND info2 IS NOT NULL
            AND reco_date = $1
            ORDER BY reco_date DESC;
        `

        // 징검다리전략B (전략대표종목2)
        const queryB = `
            SELECT TO_CHAR(reco_date, 'yyyy-MM-dd') AS "일자"
                  ,info1 AS "업종명"
                  ,info2 as "시장구분명"
                  ,stock_name as "종목명"
                  ,stock_code as "종목코드"
            FROM visual.vsl_inv_strat_picks_swing
            WHERE inv_strat_dtl = '징검다리전략대표종목2'
            AND info2 IS NOT NULL
            AND reco_date = $1
            ORDER BY reco_date DESC;
        `
        
        const [resA, resB] = await Promise.all([
            pool.query(queryA, [date]),
            pool.query(queryB, [date])
        ])

        return NextResponse.json({
            strategyA: resA.rows || [],
            strategyB: resB.rows || [],
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
