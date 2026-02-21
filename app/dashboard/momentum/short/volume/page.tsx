"use client"

import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const volumeStocks = [
  {
    name: "에코프로비엠",
    code: "247540",
    price: "285,000",
    change: "+25,000",
    changePercent: "+9.62%",
    isPositive: true,
    volume: "8.5M",
    marketCap: "8.5조",
  },
  {
    name: "포스코퓨처엠",
    code: "003670",
    price: "425,000",
    change: "+35,000",
    changePercent: "+8.97%",
    isPositive: true,
    volume: "6.2M",
    marketCap: "12.3조",
  },
  {
    name: "엘앤에프",
    code: "066970",
    price: "178,500",
    change: "+12,500",
    changePercent: "+7.53%",
    isPositive: true,
    volume: "5.8M",
    marketCap: "6.7조",
  },
  {
    name: "두산에너빌리티",
    code: "034020",
    price: "18,250",
    change: "+1,150",
    changePercent: "+6.73%",
    isPositive: true,
    volume: "12.3M",
    marketCap: "9.8조",
  },
  {
    name: "HLB",
    code: "028300",
    price: "52,800",
    change: "+3,800",
    changePercent: "+7.76%",
    isPositive: true,
    volume: "4.5M",
    marketCap: "5.2조",
  },
]

export default function VolumePage() {
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
        title="거래량 전략"
        description="평균 대비 거래량이 급증한 종목을 탐지합니다"
      />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">탐지 종목</div>
            <div className="text-2xl font-bold">38</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">평균 거래량 증가</div>
            <div className="text-2xl font-bold text-primary">+385%</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">상승 종목</div>
            <div className="text-2xl font-bold text-green-500">32</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">하락 종목</div>
            <div className="text-2xl font-bold text-red-500">6</div>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">거래량 급증 종목</h2>
          <StockTable stocks={volumeStocks} />
        </div>
      </div>
    </div>
  )
}
