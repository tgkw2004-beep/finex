"use client"

import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const gapStocks = [
  {
    name: "한미반도체",
    code: "042700",
    price: "89,200",
    change: "+8,200",
    changePercent: "+10.12%",
    isPositive: true,
    volume: "5.8M",
    marketCap: "8.9조",
  },
  {
    name: "레인보우로보틱스",
    code: "277810",
    price: "125,500",
    change: "+10,500",
    changePercent: "+9.13%",
    isPositive: true,
    volume: "2.1M",
    marketCap: "2.1조",
  },
  {
    name: "두산로보틱스",
    code: "454910",
    price: "68,500",
    change: "+5,500",
    changePercent: "+8.73%",
    isPositive: true,
    volume: "3.5M",
    marketCap: "5.8조",
  },
  {
    name: "알테오젠",
    code: "196170",
    price: "285,000",
    change: "+22,000",
    changePercent: "+8.37%",
    isPositive: true,
    volume: "1.2M",
    marketCap: "8.2조",
  },
  {
    name: "클래시스",
    code: "214150",
    price: "42,350",
    change: "+3,150",
    changePercent: "+8.04%",
    isPositive: true,
    volume: "1.8M",
    marketCap: "1.0조",
  },
]

export default function GapPage() {
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
        title="상승갭 전략"
        description="갭 상승으로 시작한 강한 모멘텀 종목을 탐지합니다"
      />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">갭 상승 종목</div>
            <div className="text-2xl font-bold text-green-500">15</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">평균 갭 크기</div>
            <div className="text-2xl font-bold text-primary">+5.8%</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">갭 유지</div>
            <div className="text-2xl font-bold">12</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">갭 메꿈</div>
            <div className="text-2xl font-bold text-red-500">3</div>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">갭 상승 종목</h2>
          <StockTable stocks={gapStocks} />
        </div>
      </div>
    </div>
  )
}
