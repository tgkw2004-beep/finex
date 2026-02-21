"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface VolumeChartProps {
    period: "D" | "W" | "M" | "Y"
    itemCount: number
    data?: any[]
}

// Mock volume data generation (Fallback)
const generateVolumeData = (period: string, count: number) => {
    // ... same as before but used as fallback ...
    const data = []
    for (let i = 0; i < count; i++) {
        const volume = Math.floor(Math.random() * 9000000) + 1000000
        const isPositive = Math.random() > 0.4
        let label = ""
        if (period === "D") label = `${i + 1}일`
        else if (period === "W") label = `${i + 1}주`
        else if (period === "M") label = `${Math.floor(i / 12) + 2023}.${(i % 12) + 1}`
        else label = `${2015 + i}`

        data.push({
            date: label,
            volume,
            isPositive,
        })
    }
    return data
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload

    return (
        <div className="rounded-lg border border-border/50 bg-background/80 backdrop-blur-md px-3 py-2 shadow-lg">
            <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
            <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">거래량</span>
                <span className={`font-medium ${data.isPositive ? "text-red-500" : "text-blue-500"}`}>
                    {data.volume.toLocaleString()}
                </span>
            </div>
        </div>
    )
}

export function VolumeChart({ period, itemCount, data: inputData }: VolumeChartProps) {
    const data = inputData && inputData.length > 0
        ? inputData.map((d: any) => ({
            date: d.date,
            volume: d.volume,
            isPositive: d.close >= d.open // Determine color based on price action if available
        }))
        : generateVolumeData(period, itemCount)

    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        axisLine={{ stroke: "hsl(var(--border))", strokeOpacity: 0.3 }}
                        tickLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                    />
                    <Tooltip cursor={{ fill: "hsl(var(--muted/0.2))" }} content={<CustomTooltip />} />
                    <Bar
                        dataKey="volume"
                        shape={(props: any) => {
                            const { x, y, width, height, payload } = props
                            if (!payload) return null
                            const fill = payload.isPositive ? "#ef4444" : "#3b82f6"
                            return <rect x={x} y={y} width={width * 0.7} height={height} fill={fill} opacity={0.8} rx={2} />
                        }}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
