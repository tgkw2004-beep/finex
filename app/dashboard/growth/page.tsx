"use client"

import { useState } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"

// Mock data
const growthStocks = [
  {
    name: "카카오",
    code: "035720",
    price: "52,500",
    change: "+2,500",
    changePercent: "+5.00%",
    isPositive: true,
    volume: "5.2M",
    marketCap: "23.4조",
  },
  {
    name: "네이버",
    code: "035420",
    price: "215,000",
    change: "+8,000",
    changePercent: "+3.86%",
    isPositive: true,
    volume: "1.8M",
    marketCap: "35.2조",
  },
  {
    name: "셀트리온",
    code: "068270",
    price: "185,500",
    change: "+6,500",
    changePercent: "+3.63%",
    isPositive: true,
    volume: "2.1M",
    marketCap: "25.8조",
  },
]

export default function GrowthPage() {
  const [analyzed, setAnalyzed] = useState(false)

  return (
    <div>
      <AnalysisHeader
        title="성장주 분석"
        description="높은 성장 잠재력을 가진 종목을 발굴합니다"
        creditCost={3}
        onAnalyze={() => setAnalyzed(true)}
      />

      {analyzed ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">평균 매출 성장률</div>
              <div className="text-2xl font-bold text-green-500">+25.3%</div>
            </Card>
            <Card className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">평균 영업이익률</div>
              <div className="text-2xl font-bold">18.7%</div>
            </Card>
            <Card className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">추천 종목</div>
              <div className="text-2xl font-bold text-primary">10</div>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">고성장 종목</h2>
            <StockTable stocks={growthStocks} />
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">분석 실행 버튼을 클릭하여 성장주 분석을 시작하세요</p>
        </Card>
      )}
    </div>
  )
}
