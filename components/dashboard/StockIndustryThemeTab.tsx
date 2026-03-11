"use client"

import React, { useEffect, useState } from 'react'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

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

interface ThemeStock {
    stock_code: string
    stock_name: string
    revenue: number
    close_price: number
    change_rate: number
    date: string
}

interface ThemeData {
    theme_code: string
    theme_name: string
    date: string
    stocks: ThemeStock[]
}

interface StockIndustryThemeTabProps {
    symbol: string
}


// ─── Stock Treemap Cell (업종 내 종목 히트맵) ─────────────────────────────────

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

// ─── Theme股 Treemap Cell ─────────────────────────────────────────────────────

const ThemeStockCell = (props: any) => {
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
                        {Math.round(revenue / 1e8).toLocaleString()}억
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

const ThemeStockTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
        const d = payload[0].payload
        return (
            <div className="bg-background border rounded p-2 shadow-md text-sm">
                <p className="font-bold">{d.stock_name} ({d.stock_code})</p>
                <p>시가총액: {Math.round(d.revenue / 1e8).toLocaleString()}억</p>
                <p className={d.change_rate > 0 ? 'text-red-500' : d.change_rate < 0 ? 'text-blue-500' : 'text-gray-500'}>
                    등락률: {d.change_rate > 0 ? '+' : ''}{d.change_rate}%
                </p>
            </div>
        )
    }
    return null
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StockIndustryThemeTab({ symbol }: StockIndustryThemeTabProps) {
    // 업종 state
    const [industries, setIndustries] = useState<{
        target: any
        large: IndustryGroup
        medium: IndustryGroup
        small: IndustryGroup
        referenceDate: string
    } | null>(null)

    // 테마 state
    const [themes, setThemes] = useState<ThemeData[]>([])
    const [selectedTheme, setSelectedTheme] = useState<string>('')

    const [loadingIndustry, setLoadingIndustry] = useState(true)
    const [loadingTheme, setLoadingTheme] = useState(true)

    // 업종 데이터 fetch
    useEffect(() => {
        if (!symbol) return
        setLoadingIndustry(true)
        Promise.all([
            fetch(`/api/stocks/${symbol}/industries`).then(r => r.ok ? r.json() : null),
        ]).then(([ind]) => {
            if (ind && ind.industries) {
                setIndustries({
                    target: ind.target,
                    large: ind.industries.large,
                    medium: ind.industries.medium,
                    small: ind.industries.small,
                    referenceDate: ind.referenceDate,
                })
            }
        }).catch(console.error)
            .finally(() => setLoadingIndustry(false))
    }, [symbol])

    // 테마 데이터 fetch
    useEffect(() => {
        if (!symbol) return
        setLoadingTheme(true)
        fetch(`/api/stocks/${symbol}/themes`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                const list: ThemeData[] = data?.themes || []
                setThemes(list)
                if (list.length > 0) setSelectedTheme(list[0].theme_code)
            })
            .catch(console.error)
            .finally(() => setLoadingTheme(false))
    }, [symbol])

    return (
        <div className="space-y-0">
            <Tabs defaultValue="industry" className="w-full">
                {/* 메인 탭: 업종 / 테마 */}
                <TabsList className="h-auto bg-transparent p-0 mb-4 border-b w-full justify-start rounded-none gap-6">
                    <TabsTrigger
                        value="industry"
                        className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2.5 border-b-2 border-transparent transition-all font-medium"
                    >
                        업종 (WICS)
                    </TabsTrigger>
                    <TabsTrigger
                        value="theme"
                        className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2.5 border-b-2 border-transparent transition-all font-medium"
                    >
                        테마
                        {themes.length > 0 && (
                            <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                                {themes.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* ── 업종 탭 ── */}
                <TabsContent value="industry" className="mt-0">
                    {loadingIndustry ? (
                        <Skeleton className="w-full h-[500px]" />
                    ) : (
                        <div className="space-y-2">
                            {industries?.target && (
                                <p className="text-sm text-muted-foreground">
                                    {industries.target.stock_name} ({industries.target.stock_code})
                                    &nbsp;—&nbsp;
                                    <span className="text-foreground font-medium">{industries.target.wics_name1}</span>
                                    {industries.target.wics_name2 && <> / {industries.target.wics_name2}</>}
                                    {industries.target.wics_name3 && <> / {industries.target.wics_name3}</>}
                                </p>
                            )}

                            <Tabs defaultValue="large" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-4">
                                    <TabsTrigger value="large">대분류</TabsTrigger>
                                    <TabsTrigger value="medium">중분류</TabsTrigger>
                                    <TabsTrigger value="small">소분류</TabsTrigger>
                                </TabsList>

                                {/* 대/중/소 분류 종목 Treemap */}
                                {(['large', 'medium', 'small'] as const).map(key => {
                                    const group = industries?.[key]
                                    return (
                                        <TabsContent key={key} value={key} className="mt-0">
                                            <div className="h-[500px] w-full border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/50 relative">
                                                {group?.stocks?.length ? (
                                                    <>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <Treemap
                                                                data={group.stocks.map(s => ({
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
                                                        <div className="absolute top-2 right-2 bg-white/80 dark:bg-black/40 p-2 rounded text-xs backdrop-blur-sm border shadow-sm">
                                                            <span className="font-bold mr-2">{group.name}</span>
                                                            <span className="text-muted-foreground">기준일: {industries?.referenceDate}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                                        데이터가 없습니다.
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    )
                                })}
                            </Tabs>
                        </div>
                    )}
                </TabsContent>

                {/* ── 테마 탭 ── */}
                <TabsContent value="theme" className="mt-0">
                    {loadingTheme ? (
                        <Skeleton className="w-full h-[400px]" />
                    ) : themes.length === 0 ? (
                        <div className="flex items-center justify-center h-[200px] text-muted-foreground border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            관련 테마 정보가 없습니다.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* 테마 선택 버튼 */}
                            <div className="flex flex-wrap gap-2">
                                {themes.map(t => (
                                    <button
                                        key={t.theme_code}
                                        onClick={() => setSelectedTheme(t.theme_code)}
                                        className={`px-3 py-1.5 rounded-full text-sm border transition-all whitespace-nowrap ${selectedTheme === t.theme_code
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                            : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                                            }`}
                                    >
                                        {t.theme_name}
                                    </button>
                                ))}
                            </div>

                            {/* 선택된 테마 히트맵 */}
                            {themes.filter(t => t.theme_code === selectedTheme).map(t => (
                                <div key={t.theme_code} className="h-[460px] w-full border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/50 relative">
                                    {t.stocks.length > 0 ? (
                                        <>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <Treemap
                                                    data={t.stocks.map(s => ({
                                                        ...s,
                                                        name: s.stock_name || s.stock_code,
                                                        value: s.revenue && s.revenue > 0 ? s.revenue : 1,
                                                    }))}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    aspectRatio={4 / 3}
                                                    stroke="#fff"
                                                    fill="#8884d8"
                                                    isAnimationActive={false}
                                                    content={<ThemeStockCell />}
                                                >
                                                    <Tooltip content={<ThemeStockTooltip />} />
                                                </Treemap>
                                            </ResponsiveContainer>
                                            <div className="absolute top-2 right-2 bg-white/80 dark:bg-black/40 p-2 rounded text-xs backdrop-blur-sm border shadow-sm">
                                                <span className="font-bold mr-2">{t.theme_name}</span>
                                                <span className="text-muted-foreground">기준: {t.date}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            테마 종목 데이터가 없습니다.
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
