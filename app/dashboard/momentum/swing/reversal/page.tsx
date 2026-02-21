"use client"

import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const stocks = [
  { name: "LG전자", code: "066570", price: "98,500", change: "+4,200", changePercent: "+4.45%", isPositive: true, volume: "1.8M", marketCap: "16.1조" },
  { name: "SK이노베이션", code: "096770", price: "118,500", change: "+5,500", changePercent: "+4.87%", isPositive: true, volume: "0.9M", marketCap: "11.1조" },
  { name: "한화솔루션", code: "009830", price: "32,450", change: "+1,450", changePercent: "+4.68%", isPositive: true, volume: "2.5M", marketCap: "6.2조" },
]

export default function ReversalPage() {
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
      <AnalysisHeader title="추세전환 전략" description="하락 추세에서 상승 전환 신호가 발생한 종목을 탐지합니다" />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">전환 신호</div>
            <div className="text-2xl font-bold text-green-500">14</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">확인 단계</div>
            <div className="text-2xl font-bold text-primary">8</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">성공률</div>
            <div className="text-2xl font-bold">68%</div>
          </Card>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold">추세전환 종목</h2>
          <StockTable stocks={stocks} />
        </div>
      </div>
    </div>
  )
}
