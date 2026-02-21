"use client"

import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const stocks = [
  { name: "SK텔레콤", code: "017670", price: "52,800", change: "+800", changePercent: "+1.54%", isPositive: true, volume: "0.8M", marketCap: "12.7조" },
  { name: "KT", code: "030200", price: "38,250", change: "+550", changePercent: "+1.46%", isPositive: true, volume: "1.2M", marketCap: "9.9조" },
  { name: "LG유플러스", code: "032640", price: "12,350", change: "+150", changePercent: "+1.23%", isPositive: true, volume: "2.5M", marketCap: "5.4조" },
]

export default function InstitutionPage() {
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
      <AnalysisHeader title="기관매집 전략" description="기관 투자자의 지속적인 순매수가 발생한 종목을 탐지합니다" />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">매집 종목</div>
            <div className="text-2xl font-bold text-green-500">25</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">평균 매집 기간</div>
            <div className="text-2xl font-bold text-primary">18일</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">누적 순매수</div>
            <div className="text-2xl font-bold">1.2조</div>
          </Card>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold">기관 매집 종목</h2>
          <StockTable stocks={stocks} />
        </div>
      </div>
    </div>
  )
}
