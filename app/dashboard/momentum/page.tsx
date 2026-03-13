"use client"

import { useState } from "react"
import Link from "next/link"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingDown, BarChart3, LineChart, TrendingUp, Clock } from "lucide-react"

const shortTermStrategies = [
  { name: "종가매매", href: "/dashboard/momentum/short/closing", icon: Clock, description: "종가 기준 매매 전략" },
  { name: "반등수급", href: "/dashboard/momentum/short/rebound", icon: TrendingUp, description: "단기 하락 후 수급 유입 반등 종목" },
  { name: "신규상장", href: "/dashboard/momentum/short/ipo", icon: TrendingUp, description: "최근 6개월 신규 상장 종목 분석" },
  { name: "눌림목", href: "/dashboard/momentum/short/pullback", icon: TrendingDown, description: "상승 후 조정 구간 진입점 포착" },
  { name: "거래량", href: "/dashboard/momentum/short/volume", icon: BarChart3, description: "거래량 급증 종목 탐지" },
  { name: "이동평균", href: "/dashboard/momentum/short/ma", icon: LineChart, description: "이동평균선 돌파 신호" },
  { name: "상승갭", href: "/dashboard/momentum/short/gap", icon: TrendingUp, description: "갭 상승 출현 종목" },
]

const swingStrategies = [
  { name: "추세전환", href: "/dashboard/momentum/swing/reversal", icon: TrendingUp, description: "추세 전환 신호 포착" },
  { name: "박스권돌파", href: "/dashboard/momentum/swing/breakout", icon: BarChart3, description: "박스권 상단 돌파 종목" },
  { name: "지지선반등", href: "/dashboard/momentum/swing/support", icon: LineChart, description: "주요 지지선 반등 종목" },
]

const trendStrategies = [
  { name: "장기상승", href: "/dashboard/momentum/trend/uptrend", icon: TrendingUp, description: "장기 상승 추세 유지 종목" },
  { name: "신고가", href: "/dashboard/momentum/trend/high", icon: BarChart3, description: "52주 신고가 돌파 종목" },
  { name: "기관매집", href: "/dashboard/momentum/trend/institution", icon: LineChart, description: "기관 순매수 누적 종목" },
]

export default function MomentumPage() {
  const [activeTab, setActiveTab] = useState("short")

  return (
    <div>
      <AnalysisHeader
        title="모멘텀 전략"
        description="최근 상승 추세가 강한 종목을 발굴합니다"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="short">단기</TabsTrigger>
          <TabsTrigger value="swing">스윙</TabsTrigger>
          <TabsTrigger value="trend">추세</TabsTrigger>
        </TabsList>

        <TabsContent value="short">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shortTermStrategies.map((strategy) => (
              <Link key={strategy.name} href={strategy.href}>
                <Card className="h-full p-4 transition-colors hover:bg-accent">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <strategy.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{strategy.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{strategy.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="swing">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {swingStrategies.map((strategy) => (
              <Link key={strategy.name} href={strategy.href}>
                <Card className="h-full p-4 transition-colors hover:bg-accent">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <strategy.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{strategy.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{strategy.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trend">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trendStrategies.map((strategy) => (
              <Link key={strategy.name} href={strategy.href}>
                <Card className="h-full p-4 transition-colors hover:bg-accent">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <strategy.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{strategy.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{strategy.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
