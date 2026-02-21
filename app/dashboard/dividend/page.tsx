"use client"

import { useState } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"

// Mock data
const dividendStocks = [
  {
    name: "SK텔레콤",
    code: "017670",
    price: "58,500",
    change: "+500",
    changePercent: "+0.86%",
    isPositive: true,
    volume: "0.8M",
    marketCap: "42.3조",
  },
  {
    name: "KT",
    code: "030200",
    price: "38,500",
    change: "+300",
    changePercent: "+0.79%",
    isPositive: true,
    volume: "1.2M",
    marketCap: "18.9조",
  },
  {
    name: "한국전력",
    code: "015760",
    price: "22,500",
    change: "+200",
    changePercent: "+0.90%",
    isPositive: true,
    volume: "3.5M",
    marketCap: "28.7조",
  },
]

export default function DividendPage() {
  const [analyzed, setAnalyzed] = useState(false)

  return (
    <div>
      <AnalysisHeader
        title="배당주 분석"
        description="안정적인 배당 수익을 제공하는 종목을 찾습니다"
        creditCost={2}
        onAnalyze={() => setAnalyzed(true)}
      />

      {analyzed ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">평균 배당수익률</div>
              <div className="text-2xl font-bold text-green-500">4.8%</div>
            </Card>
            <Card className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">배당 성장률</div>
              <div className="text-2xl font-bold">+12.5%</div>
            </Card>
            <Card className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">추천 종목</div>
              <div className="text-2xl font-bold text-primary">15</div>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">고배당 종목</h2>
            <StockTable stocks={dividendStocks} />
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">분석 실행 버튼을 클릭하여 배당주 분석을 시작하세요</p>
        </Card>
      )}
    </div>
  )
}
