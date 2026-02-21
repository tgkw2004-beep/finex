import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { DartFinancialStatement } from '@/types/stock'

export const revalidate = 60

export async function GET(
    request: NextRequest,
    { params }: { params: { symbol: string } }
) {
    try {
        const { symbol } = params

        let isError = null;
        let isData = [];

        // Query income statement data
        try {
            const res = await pool.query(`
                SELECT * 
                FROM company.dart_fs_is 
                WHERE code = $1 
                ORDER BY bsns_year DESC, reprt_code DESC
            `, [symbol])
            isData = res.rows
        } catch (e) {
            isError = e;
        }

        if (isError) {
            console.error('Financial data error:', isError)
            return NextResponse.json({
                error: isError,
                financialData: {
                    revenue: '정보 없음',
                    operatingProfit: '정보 없음',
                    netProfit: '정보 없음',
                    quarterlyData: [],
                    yearlyData: []
                }
            });
        }

        // Fallback to CIS (Comprehensive Income Statement) if IS is empty (e.g., Banks)
        let finalData = isData;
        if (!isData || isData.length === 0) {
            try {
                const cisRes = await pool.query(`
                    SELECT * 
                    FROM company.dart_fs_cis 
                    WHERE code = $1 
                    ORDER BY bsns_year DESC, reprt_code DESC
                `, [symbol])
                finalData = cisRes.rows
            } catch (cisError) {
                console.error('CIS data error:', cisError)
            }
        }

        // Process financial data
        const processFinancialData = (data: any[]) => {
            const yearlyData: any = {}
            const quarterlyData: any = {}

            data.forEach((row: DartFinancialStatement) => {
                const year = row.bsns_year
                const reportCode = row.reprt_code
                const accountName = row.account_nm
                const amount = row.thstrm_amount

                // 11011 = Annual report
                if (reportCode === '11011') {
                    if (!yearlyData[year]) {
                        yearlyData[year] = { year }
                    }

                    if (accountName === '매출액' || accountName === '영업수익' || accountName === '이자수익' || accountName === '순이자이익') {
                        if (!yearlyData[year].revenue || accountName === '영업수익') {
                            yearlyData[year].revenue = amount
                        }
                    } else if (accountName === '영업이익') {
                        yearlyData[year].operatingProfit = amount
                    } else if (accountName === '당기순이익' || accountName === '연결당기순이익' || accountName === '연결총포괄손익') {
                        if (!yearlyData[year].netProfit || accountName === '당기순이익' || accountName === '연결당기순이익') {
                            yearlyData[year].netProfit = amount
                        }
                    }
                }
                // Quarterly reports: 11013 (Q1), 11014 (Q3)
                else if (reportCode === '11013' || reportCode === '11014') {
                    const quarter = reportCode === '11013' ? 'Q1' : 'Q3'
                    const key = `${year} ${quarter}`

                    if (!quarterlyData[key]) {
                        quarterlyData[key] = { quarter: key }
                    }

                    if (accountName === '매출액' || accountName === '영업수익' || accountName === '이자수익' || accountName === '순이자이익') {
                        if (!quarterlyData[key].revenue || accountName === '영업수익') {
                            quarterlyData[key].revenue = amount
                        }
                    } else if (accountName === '영업이익') {
                        quarterlyData[key].operatingProfit = amount
                    } else if (accountName === '당기순이익' || accountName === '분기연결순이익' || accountName === '연결당기순이익') {
                        if (!quarterlyData[key].netProfit || accountName === '당기순이익' || accountName === '연결당기순이익') {
                            quarterlyData[key].netProfit = amount
                        }
                    }
                }
            })

            return {
                yearlyData: Object.values(yearlyData)
                    .sort((a: any, b: any) => parseInt(b.year) - parseInt(a.year))
                    .slice(0, 5),
                quarterlyData: Object.values(quarterlyData).slice(0, 5),
            }
        }


        const { yearlyData, quarterlyData } = processFinancialData(finalData || [])

        // Calculate basic metrics (placeholder values for now)
        const latestYear: any = yearlyData[0] || {}

        const financialData = {
            revenue: latestYear.revenue || '정보 없음',
            operatingProfit: latestYear.operatingProfit || '정보 없음',
            netProfit: latestYear.netProfit || '정보 없음',
            eps: '정보 없음', // TODO: Calculate from data
            per: '정보 없음', // TODO: Calculate from data
            pbr: '정보 없음', // TODO: Calculate from data
            roe: '정보 없음', // TODO: Calculate from data
            debtRatio: '정보 없음', // TODO: Get from balance sheet
            quarterlyData,
            yearlyData,
        }

        return NextResponse.json({ financialData })
    } catch (error) {
        console.error('Financials API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
