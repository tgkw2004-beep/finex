import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { DartCompanyInfo } from '@/types/stock'

export const revalidate = 60

export async function GET(
    request: NextRequest,
    { params }: { params: { symbol: string } }
) {
    try {
        const { symbol } = params

        // Query company info from company.dart_company_info
        const res = await pool.query(`
            SELECT * 
            FROM company.dart_company_info 
            WHERE stock_code = $1 
            LIMIT 1
        `, [symbol])

        if (res.rowCount === 0) {
            return NextResponse.json(
                { error: 'Company not found' },
                { status: 404 }
            )
        }

        const company = res.rows[0] as DartCompanyInfo

        // Transform to CompanyInfo format
        const companyInfo = {
            corpCode: company.corp_code,
            corpName: company.corp_name,
            stockName: company.stock_name,
            stockCode: company.stock_code,
            ceoName: company.ceo_nm,
            corpCls: company.corp_cls,
            industry: company.induty_name || '정보 없음',
            sector: '정보 없음', // TODO: Add sector mapping
            employees: '정보 없음', // TODO: Get from additional table
            founded: company.est_dt || '정보 없음',
            headquarters: company.adres || '정보 없음',
            website: company.hm_url || '정보 없음',
            description: `${company.corp_name}은(는) ${company.induty_name || '다양한 분야'}에서 활동하는 기업입니다.`,
        }

        return NextResponse.json({ companyInfo })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
