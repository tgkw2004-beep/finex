"use client"

import { useState } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data
const technicalStocks = [
  {
    name: "LG전자",
    code: "066570",
    price: "125,000",
    change: "+3,500",
    changePercent: "+2.88%",
    isPositive: true,
    volume: "1.5M",
    marketCap: "21.2조",
  },
  {
    name: "삼성SDI",
    code: "006400",
    price: "485,000",
    change: "+15,000",
    changePercent: "+3.19%",
    isPositive: true,
    volume: "0.7M",
    marketCap: "33.8조",
  },
  {
    name: "LG화학",
    code: "051910",
    price: "425,000",
    change: "+12,000",
    changePercent: "+2.90%",
    isPositive: true,
    volume: "0.9M",
    marketCap: "30.1조",
  },
]

export default function TechnicalPage() {
  const [analyzed, setAnalyzed] = useState(false)

  return (
    <div>
      <AnalysisHeader
        title="기술적 분석"
        description="차트 패턴과 기술적 지표로 매매 시점을 포착합니다"
        creditCost={4}
        onAnalyze={() => setAnalyzed(true)}
      />

      {analyzed ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">골든크로스</div>
              <div className="text-2xl font-bold text-green-500">23</div>
            </Card>
            <Card className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">데드크로스</div>
              <div className="text-2xl font-bold text-red-500">8</div>
            </Card>
            <Card className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">과매수</div>
              <div className="text-2xl font-bold">12</div>
            </Card>
            <Card className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">과매도</div>
              <div className="text-2xl font-bold">15</div>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">기술적 신호</h2>
            <Tabs defaultValue="golden">
              <TabsList>
                <TabsTrigger value="golden">골든크로스</TabsTrigger>
                <TabsTrigger value="breakout">돌파</TabsTrigger>
                <TabsTrigger value="oversold">과매도</TabsTrigger>
              </TabsList>
              <TabsContent value="golden" className="mt-4">
                <StockTable stocks={technicalStocks} />
              </TabsContent>
              <TabsContent value="breakout" className="mt-4">
                <StockTable stocks={technicalStocks} />
              </TabsContent>
              <TabsContent value="oversold" className="mt-4">
                <StockTable stocks={technicalStocks} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">분석 실행 버튼을 클릭하여 기술적 분석을 시작하세요</p>
        </Card>
      )}
    </div>
  )
}
