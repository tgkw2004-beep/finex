import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
    try {
        // Find holding-related tables across all schemas
        const tablesRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema='company' AND table_name='dart_major_stock'
            ORDER BY ordinal_position
        `)

        const sampleRes = await pool.query(`SELECT * FROM company.dart_major_stock LIMIT 2`)

        let companySample = null
        let companyError = null
        try {
            const res2 = await pool.query('SELECT * FROM company.master_company_list LIMIT 1')
            companySample = res2.rows[0]
        } catch (e: any) {
            companyError = e.message
        }

        return NextResponse.json({
            columns: tablesRes.rows,
            sample: sampleRes.rows,
            master_company_sample: companySample,
            company_error: companyError
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message })
    }
}
