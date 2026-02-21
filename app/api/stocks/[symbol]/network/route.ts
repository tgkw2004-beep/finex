import { NextRequest, NextResponse } from 'next/server'
import { supabase as publicSupabase } from '@/lib/supabase/client'
import pool from '@/lib/db'

export const revalidate = 60

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await params

        // 1. Get company info and group
        const targetRes = await pool.query(`
            SELECT stock_name, stock_code, corp_code, corp_name, corp_group, revenue 
            FROM company.master_company_list 
            WHERE stock_code = $1 
            LIMIT 1
        `, [symbol])

        const targetCompany = targetRes.rows[0]

        if (!targetCompany) {
            return NextResponse.json(
                { error: 'Company not found' },
                { status: 404 }
            )
        }

        const corpGroup = targetCompany.corp_group
        // If no group or "일반", return simple self-node (or handle gracefully)
        if (!corpGroup || corpGroup === '일반' || corpGroup === '-') {
            return NextResponse.json({
                nodes: [{
                    id: targetCompany.stock_code,
                    name: targetCompany.stock_name,
                    revenue: parseFloat(targetCompany.revenue) || 0,
                    change: 0, // Placeholder
                    isListed: true,
                    group: corpGroup
                }],
                links: []
            })
        }

        // 2. Get all companies in the group
        const groupRes = await pool.query(`
            SELECT stock_name, stock_code, corp_code, corp_name, revenue, wics_name1, wics_name2 
            FROM company.master_company_list 
            WHERE corp_group = $1
        `, [corpGroup])

        const groupCompanies = groupRes.rows

        const companyMapByStockName = new Map<string, any>()
        const companyMapByCorpCode = new Map<string, any>()
        const nodes: any[] = []

        // 2.1 Fetch financial data (sales) for group companies
        const stockCodes = groupCompanies
            .map(c => c.stock_code)
            .filter(code => code) as string[]

        // Fetch from KOSPI
        const kospiRes = await pool.query(`
            SELECT shortcode, sales, referenceyearmonth 
            FROM company.kis_kospi_info 
            WHERE shortcode = ANY($1) 
            ORDER BY referenceyearmonth DESC
        `, [stockCodes])

        // Fetch from KOSDAQ
        const kosdaqRes = await pool.query(`
            SELECT shortcode, sales, referenceyearmonth 
            FROM company.kis_kosdaq_info 
            WHERE shortcode = ANY($1) 
            ORDER BY referenceyearmonth DESC
        `, [stockCodes])

        // Create map of latest sales: stock_code -> sales
        const salesMap = new Map<string, number>()

        const processFinancials = (data: any[]) => {
            if (!data) return
            data.forEach(item => {
                if (!salesMap.has(item.shortcode)) {
                    salesMap.set(item.shortcode, parseFloat(item.sales) || 0)
                }
            })
        }

        processFinancials(kospiRes.rows)
        processFinancials(kosdaqRes.rows)

        groupCompanies.forEach(comp => {
            if (comp.stock_code || comp.corp_code) {
                const id = comp.stock_code || comp.corp_code

                // Use sales from KIS tables if available, otherwise fallback to comp.revenue
                const revenue = salesMap.get(comp.stock_code) || parseFloat(comp.revenue) || 0

                const node = {
                    id: id,
                    name: comp.stock_name || comp.corp_name,
                    revenue: revenue,
                    change: 0,
                    isListed: !!comp.stock_code,
                    group: corpGroup,
                    isTarget: id === targetCompany.stock_code // Mark target
                }
                nodes.push(node)

                if (comp.stock_name) companyMapByStockName.set(comp.stock_name, id)
                if (comp.corp_code) companyMapByCorpCode.set(comp.corp_code, id)
            }
        })

        // 3. Get ALL holdings where Investor IS IN the group
        const investorNames = Array.from(companyMapByStockName.keys())

        // Still using Supabase for this local table since it wasn't exposed on the remote DB
        const { data: holdings, error: holdingsError } = await publicSupabase
            .from('major_stock_holdings')
            .select('rcept_dt, corp_code, corp_name, repror, stkrt')
            .in('repror', investorNames)
            .order('rcept_dt', { ascending: false })

        if (holdingsError) throw holdingsError

        // 3.1 Identify External Nodes (Investees not in Group)
        const externalCorpCodes = new Set<string>()
        const groupCorpCodes = new Set(groupCompanies.map(c => c.corp_code))

        holdings.forEach(h => {
            if (h.corp_code && !groupCorpCodes.has(h.corp_code)) {
                externalCorpCodes.add(h.corp_code)
            }
        })

        // 3.2 Fetch Metadata for External Nodes
        const externalNodesMap = new Map<string, any>()
        const extCodesArray = Array.from(externalCorpCodes)

        if (extCodesArray.length > 0) {
            const extRes = await pool.query(`
                SELECT stock_name, stock_code, corp_code, corp_name, revenue 
                FROM company.master_company_list 
                WHERE corp_code = ANY($1)
            `, [extCodesArray])

            const externalCompanies = extRes.rows

            externalCompanies.forEach(c => {
                const revenue = parseFloat(c.revenue) || 0
                externalNodesMap.set(c.corp_code, {
                    id: c.stock_code || c.corp_code,
                    name: c.stock_name || c.corp_name,
                    revenue: revenue,
                    isListed: !!c.stock_code,
                    group: 'External', // Mark as external
                    isTarget: false
                })
                // Add to main lookup maps to support linking
                if (c.stock_name) companyMapByStockName.set(c.stock_name, c.stock_code || c.corp_code)
                if (c.corp_code) companyMapByCorpCode.set(c.corp_code, c.stock_code || c.corp_code)
            })
        }

        // Add External Nodes to the list
        externalCorpCodes.forEach(code => {
            if (!externalNodesMap.has(code)) {
                // Not found in master list -> Likely Unlisted or Data Missing
                const holdingInfo = holdings.find(h => h.corp_code === code)
                if (holdingInfo) {
                    const id = code
                    const node = {
                        id: id,
                        name: holdingInfo.corp_name,
                        revenue: 0, // Unknown
                        isListed: false,
                        group: 'External',
                        isTarget: false
                    }
                    nodes.push(node)
                    // Add to lookup (corp_code is the key here)
                    companyMapByCorpCode.set(code, id)
                }
            } else {
                nodes.push(externalNodesMap.get(code))
            }
        })

        // 4. Process links
        const links: any[] = []
        const edgesSet = new Set<string>() // To track unique "Investor(Source) -> Investee(Target)"

        for (const h of holdings) {
            const investorId = companyMapByStockName.get(h.repror) // Source (Group Member)
            const investeeId = companyMapByCorpCode.get(h.corp_code) // Target (Group or External)

            // Link if both nodes exist (Investor is Group, Investee is Group OR External)
            if (investorId && investeeId && investorId !== investeeId) {
                const edgeKey = `${investorId}-${investeeId}`

                if (!edgesSet.has(edgeKey)) {
                    edgesSet.add(edgeKey)
                    links.push({
                        source: investorId,
                        target: investeeId,
                        stkrt: h.stkrt,
                        rcept_dt: h.rcept_dt
                    })
                }
            }
        }

        return NextResponse.json({
            nodes,
            links,
            groupName: corpGroup
        })

    } catch (error) {
        console.error('Network API Error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
