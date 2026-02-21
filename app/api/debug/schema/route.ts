import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
    try {
        let holdingSample = null
        let holdingError = null

        try {
            // 1. Check major_stock_holdings in remote_company
            const res = await pool.query('SELECT * FROM company.major_stock_holdings LIMIT 1')
            holdingSample = res.rows[0]
        } catch (e: any) {
            holdingError = e.message
        }

        let companySample = null
        let companyError = null

        try {
            // 2. Check master_company_list for Industry info
            const res2 = await pool.query('SELECT * FROM company.master_company_list LIMIT 1')
            companySample = res2.rows[0]
        } catch (e: any) {
            companyError = e.message
        }

        return NextResponse.json({
            major_stock_holdings_source: 'remote_company',
            major_stock_holdings_sample: holdingSample,
            holding_error: holdingError,

            master_company_sample: companySample,
            company_error: companyError
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message })
    }
}
