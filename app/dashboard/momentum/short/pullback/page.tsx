"use client"

import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const pullbackStocks = [
  {
    name: "삼성전자",
    code: "005930",
    price: "71,500",
    change: "-1,200",
    changePercent: "-1.65%",
    isPositive: false,
    volume: "12.5M",
    marketCap: "426.8조",
  },
  {
    name: "SK하이닉스",
    code: "000660",
    price: "128,500",
    change: "-2,500",
    changePercent: "-1.91%",
    isPositive: false,
    volume: "3.2M",
    marketCap: "93.5조",
  },
  {
    name: "LG에너지솔루션",
    code: "373220",
    price: "385,000",
    change: "-8,000",
    changePercent: "-2.04%",
    isPositive: false,
    volume: "0.8M",
    marketCap: "90.2조",
  },
  {
    name: "현대차",
    code: "005380",
    price: "186,500",
    change: "-3,500",
    changePercent: "-1.84%",
    isPositive: false,
    volume: "1.1M",
    marketCap: "39.4조",
  },
  {
    name: "기아",
    code: "000270",
    price: "89,500",
    change: "-1,800",
    changePercent: "-1.97%",
    isPositive: false,
    volume: "1.5M",
    marketCap: "36.3조",
  },
]

export default function PullbackPage() {
  return (
    <div>
      <div className="mb-4">
        <Link href="/dashboard/momentum">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            모멘텀 전략으로 돌아가기
          </Button>
        </Link>
      </div>

      <AnalysisHeader
        title="눌림목 전략"
        description="상승 추세 후 조정 구간에서 매수 진입점을 포착합니다"
      />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">탐지 종목</div>
            <div className="text-2xl font-bold">24</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">평균 조정률</div>
            <div className="text-2xl font-bold text-red-500">-1.88%</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">매수 추천</div>
            <div className="text-2xl font-bold text-primary">8</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">평균 반등 예상</div>
            <div className="text-2xl font-bold text-green-500">+4.2%</div>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">눌림목 진입 대기 종목</h2>
          <StockTable stocks={pullbackStocks} />
        </div>
      </div>
    </div>
  )
}
