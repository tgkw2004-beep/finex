"use client"

import React, { useEffect, useState } from 'react'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// ─── Types ───────────────────────────────────────────────────────────────────

interface SectorItem {
    label: string
    size: number
    color: number   // avg 3m price rate
    is_selected: number
}

interface IndustryStock {
    stock_code: string
    stock_name: string
    revenue: number
    price: number
    change_rate: number
    wics_name1: string
    wics_name2: string
    wics_name3: string
}

interface IndustryGroup {
    name: string
    stocks: IndustryStock[]
}

interface IndustryData {
    target: any
    industries: {
        large: IndustryGroup
        medium: IndustryGroup
        small: IndustryGroup
    }
    referenceDate: string
}

interface StockIndustryTabProps {
    symbol: string
}

// ─── Sector Heatmap Cell ─────────────────────────────────────────────────────

const SectorCell = (props: any) => {
    const { x, y, width, height, label, color, is_selected } = props

    const bgColor =
        is_selected === 1 ? '#f59e0b'         // amber: current sector
            : color > 5 ? '#dc2626'         // dark red
                : color > 2 ? '#ef4444'         // red
                    : color > 0 ? '#fca5a5'         // light red
                        : color > -2 ? '#93c5fd'         // light blue
                            : color > -5 ? '#3b82f6'         // blue
                                : '#1d4ed8'         // dark blue

    return (
        <g>
            <rect
                x={x + 1} y={y + 1}
                width={width - 2} height={height - 2}
                style={{ fill: bgColor, stroke: '#1e293b', strokeWidth: 1.5 }}
                rx={2}
            />
            {width > 50 && height > 36 && (
                <text x={x + width / 2} y={y + height / 2 - 8}
                    textAnchor="middle" fill="#fff"
                    fontSize={Math.min(13, width / 7)} fontWeight="600">
                    {label}
                </text>
            )}
            {width > 50 && height > 36 && (
                <text x={x + width / 2} y={y + height / 2 + 10}
                    textAnchor="middle" fill="#ffffffcc"
                    fontSize={Math.min(11, width / 8)}>
                    {color > 0 ? '▲' : color < 0 ? '▼' : '-'} {Math.abs(Number(color)).toFixed(2)}%
                </text>
            )}
        </g>
    )
}

const SectorTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
        const d = payload[0].payload
        return (
            <div className="bg-background border rounded-lg p-3 shadow-lg text-sm">
                <p className="font-bold text-base mb-1">{d.label}</p>
                <p className="text-muted-foreground">시가총액: {(d.size / 1e12).toFixed(1)}조</p>
                <p className={d.color >= 0 ? 'text-red-500 font-medium' : 'text-blue-500 font-medium'}>
                    3개월 수익률: {d.color >= 0 ? '+' : ''}{Number(d.color).toFixed(2)}%
                </p>
                {d.is_selected === 1 && (
                    <p className="text-amber-500 font-bold mt-1">★ 현재 종목 업종</p>
                )}
            </div>
        )
    }
    return null
}

// ─── Stock Treemap Cell ───────────────────────────────────────────────────────

const StockCell = (props: any) => {
    const { x, y, width, height, stock_name, change_rate, revenue } = props
    const fill = change_rate > 0 ? '#ef4444' : change_rate < 0 ? '#3b82f6' : '#94a3b8'
    return (
        <g>
            <rect x={x} y={y} width={width} height={height}
                style={{ fill, stroke: '#fff', strokeWidth: 2 }} />
            {width > 60 && height > 50 && (
                <>
                    <text x={x + width / 2} y={y + height / 2 - 14}
                        textAnchor="middle" fill="#fff"
                        fontSize={Math.min(14, width / 6)} fontWeight="bold">
                        {stock_name}
                    </text>
                    <text x={x + width / 2} y={y + height / 2 + 2}
                        textAnchor="middle" fill="#fff"
                        fontSize={Math.min(11, width / 7)} opacity={0.9}>
                        {Math.round(revenue / 100).toLocaleString()}억
                    </text>
                    <text x={x + width / 2} y={y + height / 2 + 18}
                        textAnchor="middle" fill="#fff"
                        fontSize={Math.min(12, width / 6)} fontWeight="bold">
                        {change_rate > 0 ? '▲' : change_rate < 0 ? '▼' : '-'} {Math.abs(change_rate).toFixed(2)}%
                    </text>
                </>
            )}
        </g>
    )
}

const StockTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
        const d = payload[0].payload
        return (
            <div className="bg-background border rounded p-2 shadow-md text-sm">
                <p className="font-bold">{d.stock_name} ({d.stock_code})</p>
                <p>매출액: {Math.round(d.revenue / 100).toLocaleString()}억</p>
                <p className={d.change_rate > 0 ? 'text-red-500' : d.change_rate < 0 ? 'text-blue-500' : 'text-gray-500'}>
                    등락률: {d.change_rate > 0 ? '+' : ''}{d.change_rate}%
                </p>
            </div>
        )
    }
    return null
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StockIndustryTab({ symbol }: StockIndustryTabProps) {
    const [sectorData, setSectorData] = useState<{ sectors: SectorItem[], current_wics: string } | null>(null)
    const [industryData, setIndustryData] = useState<IndustryData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!symbol) return
        setLoading(true)

        Promise.all([
            fetch(`/api/stocks/${symbol}/sectors`).then(r => r.ok ? r.json() : null),
            fetch(`/api/stocks/${symbol}/industries`).then(r => r.ok ? r.json() : null),
        ]).then(([sec, ind]) => {
            setSectorData(sec)
            setIndustryData(ind)
        }).catch(console.error)
            .finally(() => setLoading(false))
    }, [symbol])

    if (loading) return <Skeleton className="w-full h-[500px]" />

    return (
        <Card className="w-full border-none shadow-none">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg">WICS 업종 분석</CardTitle>
                {industryData?.target && (
                    <CardDescription>
                        {industryData.target.stock_name} ({industryData.target.stock_code})
                        — {industryData.target.wics_name1} / {industryData.target.wics_name2} / {industryData.target.wics_name3}
                    </CardDescription>
                )}
            </CardHeader>

            <CardContent className="px-0">
                <Tabs defaultValue="heatmap" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="heatmap">전체 업종 열지도</TabsTrigger>
                        <TabsTrigger value="large">대분류</TabsTrigger>
                        <TabsTrigger value="medium">중분류</TabsTrigger>
                        <TabsTrigger value="small">소분류</TabsTrigger>
                    </TabsList>

                    {/* ── 전체 업종 열지도 ── */}
                    <TabsContent value="heatmap" className="mt-0">
                        <div className="h-[520px] w-full border rounded-lg overflow-hidden bg-slate-950 relative">
                            {sectorData?.sectors?.length ? (
                                <>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <Treemap
                                            data={sectorData.sectors.map(s => ({
                                                ...s,
                                                name: s.label,
                                                value: Number(s.size) || 1,
                                            }))}
                                            dataKey="value"
                                            nameKey="name"
                                            aspectRatio={4 / 3}
                                            isAnimationActive={false}
                                            content={<SectorCell />}
                                        >
                                            <Tooltip content={<SectorTooltip />} />
                                        </Treemap>
                                    </ResponsiveContainer>
                                    {/* 범례 */}
                                    <div className="absolute bottom-2 left-2 flex gap-1 text-xs flex-wrap">
                                        {[
                                            { color: '#dc2626', label: '>+5%' },
                                            { color: '#ef4444', label: '+2~5%' },
                                            { color: '#fca5a5', label: '0~+2%' },
                                            { color: '#93c5fd', label: '0~-2%' },
                                            { color: '#3b82f6', label: '-2~-5%' },
                                            { color: '#1d4ed8', label: '<-5%' },
                                            { color: '#f59e0b', label: '현재 업종' },
                                        ].map(l => (
                                            <span key={l.label} className="flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded">
                                                <span style={{ background: l.color }} className="inline-block w-3 h-3 rounded-sm" />
                                                <span className="text-white">{l.label}</span>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                        3개월 수익률 기준 | 크기: 시가총액
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    업종 데이터가 없습니다.
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ── 대/중/소 분류 종목 Treemap ── */}
                    {(['large', 'medium', 'small'] as const).map(key => (
                        <TabsContent key={key} value={key} className="mt-0">
                            <div className="h-[500px] w-full border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/50 relative">
                                {industryData?.industries?.[key]?.stocks?.length ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <Treemap
                                            data={industryData.industries[key].stocks.map(s => ({
                                                ...s,
                                                name: s.stock_name || s.stock_code,
                                                value: (s.revenue && s.revenue > 0) ? s.revenue : 1,
                                            }))}
                                            dataKey="value"
                                            nameKey="name"
                                            aspectRatio={4 / 3}
                                            stroke="#fff"
                                            fill="#8884d8"
                                            isAnimationActive={false}
                                            content={<StockCell />}
                                        >
                                            <Tooltip content={<StockTooltip />} />
                                        </Treemap>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        데이터가 없습니다.
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-white/80 dark:bg-black/40 p-2 rounded text-xs backdrop-blur-sm border shadow-sm">
                                    <span className="font-bold mr-2">{industryData?.industries?.[key]?.name}</span>
                                    <span className="text-muted-foreground">기준일: {industryData?.referenceDate}</span>
                                </div>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    )
}
