import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 사용자 인증 확인
async function getAuthUser(req: NextRequest) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return null
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return null
    return user
}

// GET: 포트폴리오 조회 + 현재가 병합
export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Supabase에서 포트폴리오 조회
        const { data: holdings, error } = await supabaseAdmin
            .from('portfolio')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error
        if (!holdings || holdings.length === 0) {
            return NextResponse.json({ holdings: [] })
        }

        // 종목코드 목록으로 현재가 일괄 조회
        const codes = holdings.map((h: any) => h.stock_code)
        const placeholders = codes.map((_: any, i: number) => `$${i + 1}`).join(',')
        const priceResult = await pool.query(
            `SELECT DISTINCT ON (code) code, close
             FROM company.krx_stocks_ohlcv
             WHERE code IN (${placeholders})
             ORDER BY code, date DESC`,
            codes
        )
        const priceMap: Record<string, number> = {}
        priceResult.rows.forEach((r: any) => { priceMap[r.code] = Number(r.close) })

        const today = new Date()
        const enriched = holdings.map((h: any) => {
            const currentPrice = priceMap[h.stock_code] ?? 0
            const buyPrice = Number(h.buy_price)
            const shares = Number(h.shares)
            const evalAmount = currentPrice * shares
            const profit = (currentPrice - buyPrice) * shares
            const profitPct = buyPrice > 0 ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0
            const buyDate = new Date(h.buy_date)
            const holdingDays = Math.floor((today.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24))

            return {
                ...h,
                current_price: currentPrice,
                eval_amount: evalAmount,
                profit,
                profit_pct: profitPct,
                holding_days: holdingDays,
            }
        })

        return NextResponse.json({ holdings: enriched })
    } catch (error: any) {
        console.error('Portfolio GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: 종목 추가
export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { stock_code, stock_name, shares, buy_price, buy_date } = body

        if (!stock_code || !stock_name || !shares || !buy_price || !buy_date) {
            return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('portfolio')
            .insert({ user_id: user.id, stock_code, stock_name, shares, buy_price, buy_date })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ holding: data })
    } catch (error: any) {
        console.error('Portfolio POST error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH: 종목 수정
export async function PATCH(req: NextRequest) {
    try {
        const user = await getAuthUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id, shares, buy_price, buy_date } = await req.json()
        if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

        const { data, error } = await supabaseAdmin
            .from('portfolio')
            .update({ shares, buy_price, buy_date })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ holding: data })
    } catch (error: any) {
        console.error('Portfolio PATCH error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE: 종목 삭제
export async function DELETE(req: NextRequest) {
    try {
        const user = await getAuthUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await req.json()
        if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

        const { error } = await supabaseAdmin
            .from('portfolio')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Portfolio DELETE error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
