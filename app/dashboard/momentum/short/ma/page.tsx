"use client"

import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const maStocks = [
  {
    name: "삼성SDI",
    code: "006400",
    price: "485,000",
    change: "+18,500",
    changePercent: "+3.96%",
    isPositive: true,
    volume: "0.5M",
    marketCap: "33.4조",
  },
  {
    name: "카카오",
    code: "035720",
    price: "52,300",
    change: "+2,100",
    changePercent: "+4.18%",
    isPositive: true,
    volume: "4.2M",
    marketCap: "23.2조",
  },
  {
    name: "NAVER",
    code: "035420",
    price: "218,000",
    change: "+7,500",
    changePercent: "+3.56%",
    isPositive: true,
    volume: "1.8M",
    marketCap: "35.8조",
  },
  {
    name: "셀트리온",
    code: "068270",
    price: "178,500",
    change: "+5,500",
    changePercent: "+3.18%",
    isPositive: true,
    volume: "1.2M",
    marketCap: "24.5조",
  },
  {
    name: "KB금융",
    code: "105560",
    price: "58,200",
    change: "+1,800",
    changePercent: "+3.19%",
    isPositive: true,
    volume: "2.1M",
    marketCap: "24.1조",
  },
]

export default function MAPage() {
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
        title="이동평균 전략"
        description="5일선이 20일선을 돌파하는 골든크로스 종목을 탐지합니다"
      />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">골든크로스</div>
            <div className="text-2xl font-bold text-green-500">18</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">데드크로스</div>
            <div className="text-2xl font-bold text-red-500">7</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">5일선 지지</div>
            <div className="text-2xl font-bold text-primary">42</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">20일선 지지</div>
            <div className="text-2xl font-bold">28</div>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">골든크로스 발생 종목</h2>
          <StockTable stocks={maStocks} />
        </div>
      </div>
    </div>
  )
}
