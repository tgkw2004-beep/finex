"use client"

import { useState } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"

// Mock data
const valueStocks = [
  {
    name: "현대차",
    code: "005380",
    price: "215,000",
    change: "+5,000",
    changePercent: "+2.38%",
    isPositive: true,
    volume: "1.8M",
    marketCap: "45.2조",
  },
  {
    name: "기아",
    code: "000270",
    price: "98,500",
    change: "+2,500",
    changePercent: "+2.60%",
    isPositive: true,
    volume: "2.3M",
    marketCap: "38.7조",
  },
  {
    name: "포스코홀딩스",
    code: "005490",
    price: "385,000",
    change: "+8,000",
    changePercent: "+2.12%",
    isPositive: true,
    volume: "0.9M",
    marketCap: "32.5조",
  },
]

export default function ValuePage() {
  const [analyzed, setAnalyzed] = useState(false)

  return (
    <div>
      <AnalysisHeader
        title="가치 투자"
        description="저평가된 우량 종목을 찾아냅니다"
        creditCost={3}
        onAnalyze={() => setAnalyzed(true)}
      />

      {analyzed ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">평균 PER</div>
              <div className="text-2xl font-bold">8.5</div>
            </Card>
            <Card className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">평균 PBR</div>
              <div className="text-2xl font-bold">0.85</div>
            </Card>
            <Card className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">추천 종목</div>
              <div className="text-2xl font-bold text-primary">8</div>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">저평가 우량주</h2>
            <StockTable stocks={valueStocks} />
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">분석 실행 버튼을 클릭하여 가치 투자 분석을 시작하세요</p>
        </Card>
      )}
    </div>
  )
}
