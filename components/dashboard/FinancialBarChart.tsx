"use client"

import React, { useState } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Rectangle
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"

interface FinancialData {
    quarterlyData: Array<{
        quarter: string
        revenue: number
        operatingProfit: number
        netProfit: number
    }>
    yearlyData: Array<{
        year: string
        revenue: number
        operatingProfit: number
        netProfit: number
    }>
}

interface FinancialBarChartProps {
    data: FinancialData
}

export function FinancialBarChart({ data }: FinancialBarChartProps) {
    const [period, setPeriod] = useState<"annual" | "quarterly">("annual")
    const { theme } = useTheme()
    const isDark = theme === "dark"

    // Prepare data based on selection
    // Sort yearly data ascending for the chart (API returns descending)
    const chartData = period === "annual"
        ? [...data.yearlyData].sort((a, b) => parseInt(a.year) - parseInt(b.year))
        : [...data.quarterlyData].reverse() // Assuming API returns descending

    // Format Y-axis tick (Billions/Trillions)
    const formatYAxis = (value: number) => {
        if (value === 0) return '0'
        if (Math.abs(value) >= 1000000000000) return `${(value / 1000000000000).toFixed(1)}조`
        if (Math.abs(value) >= 100000000) return `${(value / 100000000).toFixed(0)}억`
        return value.toLocaleString()
    }

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/95 border border-border/50 p-3 rounded-lg shadow-lg text-xs backdrop-blur-sm">
                    <p className="font-bold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-muted-foreground w-16">{entry.name}:</span>
                            <span className="font-medium">
                                {(entry.value / 100000000).toLocaleString()}억
                            </span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <Card className="col-span-1 shadow-sm border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">
                        {period === "annual" ? "연간 실적 추이" : "분기별 실적 추이"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        최근 {period === "annual" ? "5년" : "5분기"} 매출액 및 이익 (단위: 원)
                    </CardDescription>
                </div>
                <Tabs value={period} onValueChange={(v) => setPeriod(v as "annual" | "quarterly")} className="w-[160px]">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                        <TabsTrigger value="annual" className="text-xs">연간</TabsTrigger>
                        <TabsTrigger value="quarterly" className="text-xs">분기</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent className="px-2 pb-4">
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                            barGap={2}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                            <XAxis
                                dataKey={period === "annual" ? "year" : "quarter"}
                                tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tickFormatter={formatYAxis}
                                tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }}
                                tickLine={false}
                                axisLine={false}
                                width={50}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                            />
                            <Bar
                                dataKey="revenue"
                                name="매출액"
                                fill="#3b82f6" // Blue-500
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                            />
                            <Bar
                                dataKey="operatingProfit"
                                name="영업이익"
                                fill="#22c55e" // Green-500
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                            />
                            <Bar
                                dataKey="netProfit"
                                name="순이익"
                                fill="#f59e0b" // Amber-500
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
