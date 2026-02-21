import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await params

        // vsl_naver_theme에는 이미 stock_name, close, cls_chg_rt, cap 등이 포함되어 있음
        // 최신 날짜 기준으로 해당 종목이 속한 테마 목록 및 각 테마의 종목 데이터를 한 번에 조회
        const themesRes = await pool.query(`
            WITH latest_date AS (
                SELECT MAX(date) AS max_date FROM visual.vsl_naver_theme
            ),
            my_themes AS (
                SELECT DISTINCT theme_code, theme_name
                FROM visual.vsl_naver_theme, latest_date
                WHERE stock_code = $1
                  AND date = latest_date.max_date
                LIMIT 20
            )
            SELECT
                t.theme_code,
                t.theme_name,
                TO_CHAR(v.date, 'YYYY-MM-DD') AS date,
                v.stock_code,
                v.stock_name,
                v.close::numeric        AS close_price,
                v.cls_chg_rt::numeric   AS change_rate,
                v.cap::numeric          AS revenue
            FROM my_themes t
            JOIN visual.vsl_naver_theme v
              ON v.theme_code = t.theme_code
            JOIN latest_date ld ON v.date = ld.max_date
            ORDER BY t.theme_code, v.cap DESC NULLS LAST
        `, [symbol])

        if (themesRes.rows.length === 0) {
            return NextResponse.json({ themes: [] })
        }

        // theme_code별로 그루핑
        const themeMap = new Map<string, {
            theme_code: string
            theme_name: string
            date: string
            stocks: any[]
        }>()

        for (const row of themesRes.rows) {
            if (!themeMap.has(row.theme_code)) {
                themeMap.set(row.theme_code, {
                    theme_code: row.theme_code,
                    theme_name: row.theme_name,
                    date: row.date,
                    stocks: []
                })
            }
            themeMap.get(row.theme_code)!.stocks.push({
                stock_code: row.stock_code,
                stock_name: row.stock_name,
                revenue: Number(row.revenue) || 0,
                close_price: Number(row.close_price) || 0,
                change_rate: Number(row.change_rate) || 0,
                date: row.date
            })
        }

        const themes = Array.from(themeMap.values())

        return NextResponse.json({ themes })

    } catch (error: any) {
        console.error('Theme API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal Server Error', stack: error.stack },
            { status: 500 }
        )
    }
}
