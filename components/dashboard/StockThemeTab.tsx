
"use client"

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

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

interface SectorStock {
    stock_code: string
    stock_name: string
    revenue: number
    close_price: number
    change_rate: number
    date: string
}

interface SectorData {
    sector_name: string
    sector_code: string
    stocks: SectorStock[]
}


interface StockThemeTabProps {
    symbol: string
}

const CustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, colors, rank, stock_name, change_rate, revenue } = props;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: change_rate > 0 ? '#ef4444' : (change_rate < 0 ? '#3b82f6' : '#94a3b8'), // Red (Up), Blue (Down), Gray
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {/* 1. Stock Name */}
            {width > 60 && height > 50 ? (
                <text
                    x={x + width / 2}
                    y={y + height / 2 - 14}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={Math.min(14, width / 6)}
                    fontWeight="bold"
                >
                    {stock_name}
                </text>
            ) : null}

            {/* 2. Revenue or Cap */}
            {width > 60 && height > 50 ? (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={Math.min(11, width / 7)}
                    opacity={0.9}
                >
                    {Math.round(revenue / 100000000).toLocaleString()}억
                </text>
            ) : null}

            {/* 3. Fluctuation Rate */}
            {width > 60 && height > 50 ? (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 18}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={Math.min(12, width / 6)}
                    fontWeight="bold"
                >
                    {change_rate > 0 ? '▲' : (change_rate < 0 ? '▼' : '-')} {Math.abs(change_rate).toFixed(2)}%
                </text>
            ) : null}
        </g>
    );
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-background border rounded p-2 shadow-md text-sm">
                <p className="font-bold">{data.stock_name} ({data.stock_code})</p>
                <p>규모: {Math.round(data.revenue / 100000000).toLocaleString()}억</p>
                <p className={data.change_rate > 0 ? 'text-red-500' : (data.change_rate < 0 ? 'text-blue-500' : 'text-gray-500')}>
                    등락률: {data.change_rate > 0 ? '+' : ''}{data.change_rate}%
                </p>
            </div>
        );
    }
    return null;
};

const HeatmapChart = ({ data, title, date }: { data: any[], title?: string, date?: string }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[500px] text-muted-foreground border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                데이터가 없습니다.
            </div>
        )
    }

    return (
        <div className="h-[250px] w-full border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/50 relative">
            <ResponsiveContainer width="100%" height="100%">
                <Treemap
                    data={data.map(s => ({
                        ...s,
                        name: s.stock_name || s.stock_code,
                        value: s.revenue
                    }))}
                    dataKey="value"
                    nameKey="name"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    fill="#8884d8"
                    isAnimationActive={false}
                    content={<CustomizedContent />}
                >
                    <Tooltip content={<CustomTooltip />} />
                </Treemap>
            </ResponsiveContainer>
            <div className="absolute top-2 right-2 bg-white/80 dark:bg-black/40 p-2 rounded text-xs backdrop-blur-sm border shadow-sm">
                {title && <span className="font-bold mr-2">{title}</span>}
                {date && <span className="text-muted-foreground">기준: {date}</span>}
            </div>
        </div>
    )
}

export default function StockThemeTab({ symbol }: StockThemeTabProps) {
    const [themes, setThemes] = useState<ThemeData[]>([])
    const [sectors, setSectors] = useState<{ large: SectorData | null, medium: SectorData | null, small: SectorData | null }>({ large: null, medium: null, small: null })
    const [loading, setLoading] = useState(true)
    const { theme } = useTheme()

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                // Fetch Themes
                const themeRes = await fetch(`/api/stocks/${symbol}/themes`)
                if (themeRes.ok) {
                    const data = await themeRes.json()
                    setThemes(data.themes || [])
                }

                // Fetch Sectors
                const sectorRes = await fetch(`/api/stocks/${symbol}/sectors`)
                if (sectorRes.ok) {
                    const data = await sectorRes.json()
                    setSectors({
                        large: data.large,
                        medium: data.medium,
                        small: data.small
                    })
                }

            } catch (error) {
                console.error("Failed to fetch data", error)
            } finally {
                setLoading(false)
            }
        }

        if (symbol) {
            fetchData()
        }
    }, [symbol])

    if (loading) {
        return <Skeleton className="w-full h-[400px]" />
    }

    if (themes.length === 0 && !sectors.large) {
        return (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                관련 업종/테마 정보가 없습니다.
            </div>
        )
    }

    return (
        <Card className="w-full border-none shadow-none">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg">업종/테마 분석</CardTitle>
                <CardDescription>매출액/시가총액 기준 히트맵 (색상: 전일대비 등락률)</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <Tabs defaultValue="sector" className="w-full">
                    {/* Level 1: Main Category Tabs */}
                    <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-4 space-x-6">
                        <TabsTrigger
                            value="sector"
                            className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 border-b-2 border-transparent transition-all"
                        >
                            업종 (Sector)
                        </TabsTrigger>
                        <TabsTrigger
                            value="theme"
                            className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 border-b-2 border-transparent transition-all"
                        >
                            테마 (Theme)
                        </TabsTrigger>
                    </TabsList>

                    {/* Level 1 Content: Sector */}
                    <TabsContent value="sector" className="mt-0">
                        <Tabs defaultValue="large" className="w-full">
                            {/* Level 2: Sector Sub-tabs */}
                            <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-4 space-x-4">
                                <TabsTrigger
                                    value="large"
                                    className="text-sm data-[state=active]:bg-muted rounded-md px-3 py-1 transition-all"
                                >
                                    대분류
                                </TabsTrigger>
                                <TabsTrigger
                                    value="medium"
                                    className="text-sm data-[state=active]:bg-muted rounded-md px-3 py-1 transition-all"
                                >
                                    중분류
                                </TabsTrigger>
                                <TabsTrigger
                                    value="small"
                                    className="text-sm data-[state=active]:bg-muted rounded-md px-3 py-1 transition-all"
                                >
                                    소분류
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="large" className="mt-0">
                                {sectors.large ? (
                                    <HeatmapChart
                                        data={sectors.large.stocks}
                                        title={`${sectors.large.sector_name} (대분류)`}
                                    />
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">대분류 업종 정보가 없습니다.</div>
                                )}
                            </TabsContent>

                            <TabsContent value="medium" className="mt-0">
                                {sectors.medium ? (
                                    <HeatmapChart
                                        data={sectors.medium.stocks}
                                        title={`${sectors.medium.sector_name} (중분류)`}
                                    />
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">중분류 업종 정보가 없습니다.</div>
                                )}
                            </TabsContent>

                            <TabsContent value="small" className="mt-0">
                                {sectors.small ? (
                                    <HeatmapChart
                                        data={sectors.small.stocks}
                                        title={`${sectors.small.sector_name} (소분류)`}
                                    />
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">소분류 업종 정보가 없습니다.</div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                    {/* Level 1 Content: Theme */}
                    <TabsContent value="theme" className="mt-0 space-y-4">
                        {themes.length > 0 ? (
                            <Tabs defaultValue={themes[0]?.theme_code} className="w-full">
                                {themes.length > 1 && (
                                    <TabsList className="h-auto bg-transparent p-0 mb-4 border-b pb-3 flex flex-wrap gap-2 justify-start">
                                        {themes.map((t) => (
                                            <TabsTrigger
                                                key={t.theme_code}
                                                value={t.theme_code}
                                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1 text-sm border transition-all whitespace-nowrap"
                                            >
                                                {t.theme_name}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                )}
                                {themes.map((t) => (
                                    <TabsContent key={t.theme_code} value={t.theme_code} className="mt-0">
                                        <HeatmapChart
                                            data={t.stocks}
                                            title={t.theme_name}
                                            date={t.date}
                                        />
                                    </TabsContent>
                                ))}
                            </Tabs>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">테마 정보가 없습니다.</div>
                        )}
                    </TabsContent>

                </Tabs>
            </CardContent>
        </Card>
    )
}
