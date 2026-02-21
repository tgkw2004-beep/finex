"use client"

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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

            {/* 2. Revenue (Sales) */}
            {width > 60 && height > 50 ? (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={Math.min(11, width / 7)}
                    opacity={0.9}
                >
                    {Math.round(revenue / 100).toLocaleString()}억
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
                <p>매출액: {Math.round(data.revenue / 100).toLocaleString()}억</p>
                <p className={data.change_rate > 0 ? 'text-red-500' : (data.change_rate < 0 ? 'text-blue-500' : 'text-gray-500')}>
                    등락률: {data.change_rate > 0 ? '+' : ''}{data.change_rate}%
                </p>
            </div>
        );
    }
    return null;
};

export default function StockIndustryTab({ symbol }: StockIndustryTabProps) {
    const [data, setData] = useState<IndustryData | null>(null)
    const [loading, setLoading] = useState(true)
    const { theme } = useTheme()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/stocks/${symbol}/industries`)
                if (res.ok) {
                    const json = await res.json()
                    setData(json)
                }
            } catch (error) {
                console.error("Failed to fetch industries", error)
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

    if (!data || !data.target) {
        return (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                업종 데이터가 없습니다.
            </div>
        )
    }

    return (
        <Card className="w-full border-none shadow-none">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg">WICS 업종 분석</CardTitle>
                <CardDescription>
                    {data.target.stock_name} ({data.target.stock_code}) - {data.target.wics_name1} / {data.target.wics_name2} / {data.target.wics_name3}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <Tabs defaultValue="large" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="large">대분류 ({data.industries.large.name})</TabsTrigger>
                        <TabsTrigger value="medium">중분류 ({data.industries.medium.name})</TabsTrigger>
                        <TabsTrigger value="small">소분류 ({data.industries.small.name})</TabsTrigger>
                    </TabsList>

                    {Object.entries(data.industries).map(([key, group]) => (
                        <TabsContent key={key} value={key} className="mt-0">
                            <div className="h-[500px] w-full border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/50 relative">
                                {(group as IndustryGroup).stocks.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <Treemap
                                            data={(group as IndustryGroup).stocks.map(s => ({
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
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        데이터가 없습니다.
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-white/80 dark:bg-black/40 p-2 rounded text-xs backdrop-blur-sm border shadow-sm">
                                    <span className="font-bold mr-2">{(group as IndustryGroup).name}</span>
                                    <span className="text-muted-foreground">기준일: {data.referenceDate}</span>
                                </div>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    )
}
