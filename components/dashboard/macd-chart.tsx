"use client"

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface MACDChartProps {
  period: "D" | "W" | "M" | "Y"
  itemCount: number
}

const generateMACDData = (period: "D" | "W" | "M" | "Y", count: number) => {
  const dataPoints = count
  const data = []

  for (let i = 0; i < dataPoints; i++) {
    const macd = Math.sin(i * 0.2) * 500 + Math.random() * 200 - 100
    const signal = Math.sin((i - 2) * 0.2) * 400 + Math.random() * 100 - 50
    const histogram = macd - signal

    let label = ""
    if (period === "D") label = `${i + 1}일`
    else if (period === "W") label = `${i + 1}주`
    else if (period === "M") label = `${Math.floor(i / 12) + 2023}.${(i % 12) + 1}`
    else label = `${2015 + i}`

    data.push({
      date: label,
      macd: Math.round(macd),
      signal: Math.round(signal),
      histogram: Math.round(histogram),
    })
  }

  return data
}

export function MACDChart({ period, itemCount }: MACDChartProps) {
  const data = generateMACDData(period, itemCount)

  return (
    <div className="h-[150px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover) / 0.95)",
              backdropFilter: "blur(8px)",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              padding: "6px 10px",
              fontSize: "11px",
            }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Bar
            dataKey="histogram"
            name="히스토그램"
            fill="#8884d8"
            shape={(props: any) => {
              const { x, y, width, height, payload } = props
              if (!payload) return null
              const fill = payload.histogram >= 0 ? "#ef4444" : "#3b82f6"
              return <rect x={x} y={y} width={width} height={Math.abs(height)} fill={fill} opacity={0.7} />
            }}
          />
          <Line type="monotone" dataKey="macd" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="MACD" />
          <Line type="monotone" dataKey="signal" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="Signal" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
