"use client"

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface CandlestickChartProps {
  period: string | "D" | "W" | "M" | "Y"
  itemCount: number
  data?: any[]
}

// Mock candlestick data with moving averages
const generateMockData = (period: string, count: number) => {
  const dataPoints = count
  const data = []
  let basePrice = 70000

  for (let i = 0; i < dataPoints; i++) {
    const open = basePrice + Math.random() * 2000 - 1000
    const close = open + Math.random() * 3000 - 1500
    const high = Math.max(open, close) + Math.random() * 1000
    const low = Math.min(open, close) - Math.random() * 1000
    const volume = Math.floor(Math.random() * 5000000) + 1000000

    let label = ""
    if (period === "D" || period === "1D") label = `${i + 1}일`
    else if (period === "W" || period === "1W") label = `${i + 1}주`
    else if (period === "M" || period === "1M") label = `${Math.floor(i / 12) + 2023}.${(i % 12) + 1}`
    else if (period === "Y" || period === "1Y") label = `${2015 + i}`
    else label = `${i + 1}일`

    data.push({
      date: label,
      open: Math.floor(open),
      close: Math.floor(close),
      high: Math.floor(high),
      low: Math.floor(low),
      volume: volume,
      isPositive: close >= open,
    })

    basePrice = close
  }

  const ma5Data = data.map((item, index) => {
    if (index < 4) return { ...item, ma5: null }
    const sum = data.slice(index - 4, index + 1).reduce((acc, d) => acc + d.close, 0)
    return { ...item, ma5: Math.floor(sum / 5) }
  })

  const finalData = ma5Data.map((item, index) => {
    if (index < 19) return { ...item, ma20: null }
    const sum = ma5Data.slice(index - 19, index + 1).reduce((acc, d) => acc + d.close, 0)
    return { ...item, ma20: Math.floor(sum / 20) }
  })

  return finalData
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  return (
    <div className="rounded-lg border border-border/50 bg-background/80 backdrop-blur-md px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
        <span className="text-muted-foreground">시가</span>
        <span className="text-right font-medium">{data.open?.toLocaleString()}</span>
        <span className="text-muted-foreground">종가</span>
        <span className={`text-right font-medium ${data.isPositive ? "text-red-500" : "text-blue-500"}`}>
          {data.close?.toLocaleString()}
        </span>
        <span className="text-muted-foreground">고가</span>
        <span className="text-right font-medium text-red-500">{data.high?.toLocaleString()}</span>
        <span className="text-muted-foreground">저가</span>
        <span className="text-right font-medium text-blue-500">{data.low?.toLocaleString()}</span>
      </div>
    </div>
  )
}

// Volume Tooltip
const VolumeTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  return (
    <div className="rounded-lg border border-border/50 bg-background/80 backdrop-blur-md px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">거래량</span>
        <span className="font-medium">{data.volume?.toLocaleString()}</span>
      </div>
    </div>
  )
}

const Candlestick = (props: any) => {
  const { x, y, width, height, payload } = props

  // Safety check for required props
  if (!payload || x === undefined || y === undefined || width === undefined || height === undefined) {
    return null
  }

  const { open, close, high, low, isPositive } = payload

  // Korean style: red for positive (양봉), blue for negative (음봉)
  const color = isPositive ? "#ef4444" : "#3b82f6"

  // Calculate positions based on the chart's coordinate system
  const centerX = x + width / 2

  // Get the price range from the data
  const prices = [open, close, high, low]
  const maxPrice = Math.max(...prices)
  const minPrice = Math.min(...prices)

  // Calculate relative positions within the available height
  // The y coordinate represents the top of the bar area
  const priceRange = maxPrice - minPrice

  if (priceRange === 0) {
    // If all prices are the same, draw a horizontal line
    return (
      <g>
        <line
          x1={x + width * 0.2}
          y1={y + height / 2}
          x2={x + width * 0.8}
          y2={y + height / 2}
          stroke={color}
          strokeWidth={2}
        />
      </g>
    )
  }

  // Calculate Y positions relative to the bar's coordinate space
  const getRelativeY = (price: number) => {
    const ratio = (maxPrice - price) / priceRange
    return y + ratio * height
  }

  const highY = getRelativeY(high)
  const lowY = getRelativeY(low)
  const openY = getRelativeY(open)
  const closeY = getRelativeY(close)

  // For 양봉 (positive/red): bottom is open, top is close
  // For 음봉 (negative/blue): top is open, bottom is close
  const bodyTop = isPositive ? closeY : openY
  const bodyBottom = isPositive ? openY : closeY
  const bodyHeight = Math.abs(bodyBottom - bodyTop)

  return (
    <g>
      {/* Wick (심지) - thin line from high to low */}
      <line x1={centerX} y1={highY} x2={centerX} y2={lowY} stroke={color} strokeWidth={1} />
      {/* Body (몸통) - thick rectangle from open to close */}
      <rect
        x={x + width * 0.2}
        y={bodyTop}
        width={width * 0.6}
        height={Math.max(bodyHeight, 1)} // Minimum 1px height
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
}

export function CandlestickChart({ period, itemCount, data: priceData }: CandlestickChartProps) {
  // Use real data if available, otherwise use mock data
  const mockData = generateMockData(period, itemCount)
  const hasRealData = priceData && priceData.length > 0

  // Transform real data to chart format
  const realData = hasRealData ? priceData.map((item: any, index: number) => {
    const open = Number(item.open)
    const close = Number(item.close)
    const high = Number(item.high)
    const low = Number(item.low)

    return {
      date: item.date,
      open,
      close,
      high,
      low,
      volume: Number(item.volume),
      isPositive: close >= open,
    }
  }) : []

  // Calculate moving averages for real data
  const dataWithMA = hasRealData ? (() => {
    const ma5Data = realData.map((item: any, index: number) => {
      if (index < 4) return { ...item, ma5: null }
      const sum = realData.slice(index - 4, index + 1).reduce((acc: number, d: any) => acc + d.close, 0)
      return { ...item, ma5: Math.floor(sum / 5) }
    })

    const finalData = ma5Data.map((item: any, index: number) => {
      if (index < 19) return { ...item, ma20: null }
      const sum = ma5Data.slice(index - 19, index + 1).reduce((acc: number, d: any) => acc + d.close, 0)
      return { ...item, ma20: Math.floor(sum / 20) }
    })

    return finalData
  })() : []

  const data = hasRealData ? dataWithMA : mockData

  // Calculate price range for Y-axis
  const prices = data.flatMap((d) => [d.high, d.low])
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice
  const yMin = Math.floor(minPrice - priceRange * 0.1)
  const yMax = Math.ceil(maxPrice + priceRange * 0.1)

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-amber-500" />
          <span className="text-muted-foreground">5일</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-violet-500" />
          <span className="text-muted-foreground">20일</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-sm" />
          <span className="text-muted-foreground">양봉</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-sm" />
          <span className="text-muted-foreground">음봉</span>
        </div>
      </div>

      {/* Price Chart with Candlesticks */}
      <div className="h-[140px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
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
              domain={[yMin, yMax]}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />

            <Bar dataKey="high" shape={<Candlestick />} isAnimationActive={false} />

            <Line
              type="monotone"
              dataKey="ma5"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="ma20"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <div className="h-[60px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              tick={false}
              axisLine={{ stroke: "hsl(var(--border))", strokeOpacity: 0.3 }}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip content={<VolumeTooltip />} />
            <Bar
              dataKey="volume"
              shape={(props: any) => {
                const { x, y, width, height, payload } = props
                if (!payload) return null
                const fill = payload.isPositive ? "#ef4444" : "#3b82f6"
                return <rect x={x} y={y} width={width * 0.7} height={height} fill={fill} opacity={0.7} rx={1} />
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
