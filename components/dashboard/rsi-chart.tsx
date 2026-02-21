"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface RSIChartProps {
  period: "D" | "W" | "M" | "Y"
  itemCount: number
}

const generateRSIData = (period: "D" | "W" | "M" | "Y", count: number) => {
  const dataPoints = count
  const data = []
  let rsi = 50

  for (let i = 0; i < dataPoints; i++) {
    rsi = rsi + (Math.random() - 0.5) * 20
    rsi = Math.max(10, Math.min(90, rsi))

    let label = ""
    if (period === "D") label = `${i + 1}일`
    else if (period === "W") label = `${i + 1}주`
    else if (period === "M") label = `${Math.floor(i / 12) + 2023}.${(i % 12) + 1}`
    else label = `${2015 + i}`

    data.push({
      date: label,
      rsi: Math.round(rsi * 10) / 10,
    })
  }

  return data
}

export function RSIChart({ period, itemCount }: RSIChartProps) {
  const data = generateRSIData(period, itemCount)

  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
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
            domain={[0, 100]}
            ticks={[0, 30, 50, 70, 100]}
            width={30}
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
            formatter={(value: any) => [`${value}`, "RSI"]}
          />
          {/* 과매수 영역 (70 이상) */}
          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "70", position: "right", fontSize: 10, fill: "#ef4444" }} />
          {/* 과매도 영역 (30 이하) */}
          <ReferenceLine y={30} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: "30", position: "right", fontSize: 10, fill: "#3b82f6" }} />
          <Line
            type="monotone"
            dataKey="rsi"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            name="RSI"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
