"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface InvestorTradingTableProps {
  period: string
}

// Mock investor trading data
const generateMockTradingData = (period: string) => {
  const dataPoints = period === "1D" ? 1 : period === "1W" ? 7 : period === "1M" ? 30 : 90
  const data = []

  for (let i = 0; i < Math.min(dataPoints, 10); i++) {
    data.push({
      date: `2024-01-${String(i + 1).padStart(2, "0")}`,
      foreign: {
        buy: Math.floor(Math.random() * 1000000) + 500000,
        sell: Math.floor(Math.random() * 1000000) + 500000,
      },
      institution: {
        buy: Math.floor(Math.random() * 800000) + 400000,
        sell: Math.floor(Math.random() * 800000) + 400000,
      },
      individual: {
        buy: Math.floor(Math.random() * 1200000) + 600000,
        sell: Math.floor(Math.random() * 1200000) + 600000,
      },
    })
  }

  return data
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("ko-KR").format(num)
}

const formatAmount = (num: number) => {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}억`
  } else if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`
  }
  return formatNumber(num)
}

export function InvestorTradingTable({ period }: InvestorTradingTableProps) {
  const data = generateMockTradingData(period)

  // Calculate net buying for chart
  const chartData = data.map((item) => ({
    date: item.date,
    외국인: item.foreign.buy - item.foreign.sell,
    기관: item.institution.buy - item.institution.sell,
    개인: item.individual.buy - item.individual.sell,
  }))

  // Calculate totals
  const totals = data.reduce(
    (acc, item) => {
      acc.foreign.buy += item.foreign.buy
      acc.foreign.sell += item.foreign.sell
      acc.institution.buy += item.institution.buy
      acc.institution.sell += item.institution.sell
      acc.individual.buy += item.individual.buy
      acc.individual.sell += item.individual.sell
      return acc
    },
    {
      foreign: { buy: 0, sell: 0 },
      institution: { buy: 0, sell: 0 },
      individual: { buy: 0, sell: 0 },
    },
  )

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">외국인</CardTitle>
            <CardDescription className="text-xs">순매수</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">매수</span>
                <span className="font-medium text-green-500">{formatAmount(totals.foreign.buy)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">매도</span>
                <span className="font-medium text-red-500">{formatAmount(totals.foreign.sell)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-medium">순매수</span>
                <span
                  className={`font-bold ${
                    totals.foreign.buy - totals.foreign.sell > 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {totals.foreign.buy - totals.foreign.sell > 0 ? "+" : ""}
                  {formatAmount(totals.foreign.buy - totals.foreign.sell)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">기관</CardTitle>
            <CardDescription className="text-xs">순매수</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">매수</span>
                <span className="font-medium text-green-500">{formatAmount(totals.institution.buy)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">매도</span>
                <span className="font-medium text-red-500">{formatAmount(totals.institution.sell)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-medium">순매수</span>
                <span
                  className={`font-bold ${
                    totals.institution.buy - totals.institution.sell > 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {totals.institution.buy - totals.institution.sell > 0 ? "+" : ""}
                  {formatAmount(totals.institution.buy - totals.institution.sell)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">개인</CardTitle>
            <CardDescription className="text-xs">순매수</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">매수</span>
                <span className="font-medium text-green-500">{formatAmount(totals.individual.buy)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">매도</span>
                <span className="font-medium text-red-500">{formatAmount(totals.individual.sell)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-medium">순매수</span>
                <span
                  className={`font-bold ${
                    totals.individual.buy - totals.individual.sell > 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {totals.individual.buy - totals.individual.sell > 0 ? "+" : ""}
                  {formatAmount(totals.individual.buy - totals.individual.sell)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">투자자별 순매수 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                />
                <Legend />
                <Bar dataKey="외국인" fill="#3b82f6" />
                <Bar dataKey="기관" fill="#06b6d4" />
                <Bar dataKey="개인" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <div className="overflow-x-auto rounded-lg border border-border/40">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">일자</TableHead>
              <TableHead className="whitespace-nowrap text-center" colSpan={2}>
                외국인
              </TableHead>
              <TableHead className="whitespace-nowrap text-center" colSpan={2}>
                기관
              </TableHead>
              <TableHead className="whitespace-nowrap text-center" colSpan={2}>
                개인
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead></TableHead>
              <TableHead className="text-xs text-green-500">매수</TableHead>
              <TableHead className="text-xs text-red-500">매도</TableHead>
              <TableHead className="text-xs text-green-500">매수</TableHead>
              <TableHead className="text-xs text-red-500">매도</TableHead>
              <TableHead className="text-xs text-green-500">매수</TableHead>
              <TableHead className="text-xs text-red-500">매도</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.date}>
                <TableCell className="font-medium whitespace-nowrap">{item.date}</TableCell>
                <TableCell className="text-green-500 text-sm">{formatAmount(item.foreign.buy)}</TableCell>
                <TableCell className="text-red-500 text-sm">{formatAmount(item.foreign.sell)}</TableCell>
                <TableCell className="text-green-500 text-sm">{formatAmount(item.institution.buy)}</TableCell>
                <TableCell className="text-red-500 text-sm">{formatAmount(item.institution.sell)}</TableCell>
                <TableCell className="text-green-500 text-sm">{formatAmount(item.individual.buy)}</TableCell>
                <TableCell className="text-red-500 text-sm">{formatAmount(item.individual.sell)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
