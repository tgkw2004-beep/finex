"use client"

import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const stocks = [
  { name: "신한지주", code: "055550", price: "42,350", change: "+1,350", changePercent: "+3.29%", isPositive: true, volume: "2.8M", marketCap: "21.9조" },
  { name: "하나금융지주", code: "086790", price: "48,250", change: "+1,250", changePercent: "+2.66%", isPositive: true, volume: "1.5M", marketCap: "14.4조" },
  { name: "우리금융지주", code: "316140", price: "13,850", change: "+350", changePercent: "+2.59%", isPositive: true, volume: "3.2M", marketCap: "10.1조" },
]

export default function SupportPage() {
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
      <AnalysisHeader title="지지선반등 전략" description="주요 지지선에서 반등 신호가 발생한 종목을 탐지합니다" />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">반등 종목</div>
            <div className="text-2xl font-bold text-green-500">16</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">60일선 지지</div>
            <div className="text-2xl font-bold text-primary">9</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">120일선 지지</div>
            <div className="text-2xl font-bold">7</div>
          </Card>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold">지지선 반등 종목</h2>
          <StockTable stocks={stocks} />
        </div>
      </div>
    </div>
  )
}
