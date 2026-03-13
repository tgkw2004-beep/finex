"use client"

import Link from "next/link"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { ShieldCheck, Gem, PieChart, Shield, Search } from "lucide-react"

const dividendStrategies = [
  {
    name: "개별 배당분석",
    href: "/dashboard/dividend/individual",
    icon: ShieldCheck,
    description: "안전형 고배당주 및 배당 성장주 등 상세 분석 지표를 개별적으로 확인합니다",
    tag: "통합 분석"
  },
  {
    name: "산업별 배당분석",
    href: "/dashboard/dividend/industry",
    icon: PieChart,
    description: "최근 3년간 가장 높은 배당 수익률을 기록한 산업군 TOP 10을 확인합니다",
    tag: "업종별 분석"
  },
  {
    name: "자사주 정밀 분석",
    href: "/dashboard/dividend/treasury",
    icon: Shield,
    description: "자사주 보유 현황, 실질 매입량, 주가 방어지수 등 5가지 정밀 분석 지표를 제공합니다",
    tag: "가치 보호"
  },
  {
    name: "주가별 배당 추천",
    href: "/dashboard/dividend/price",
    icon: Gem,
    description: "현재 주가가 과거 평균 대비 저평가된 고배당 종목을 산업별로 발굴합니다",
    tag: "저평가 추천"
  },
  {
    name: "전체 배당 검색",
    href: "/dashboard/dividend/search",
    icon: Search,
    description: "다양한 필터를 조합하여 과거 모든 배당 내역을 상세히 검색하고 분석합니다",
    tag: "데이터 허브"
  }
]

export default function DividendPage() {
  return (
    <div className="space-y-6">
      <AnalysisHeader
        title="배당주 분석"
        description="안정적인 현금 흐름을 창출하는 최적의 배당 전략을 선택하세요"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {dividendStrategies.map((strategy) => (
          <Link key={strategy.name} href={strategy.href} className="group">
            <Card className="h-full p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:bg-accent/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                  {strategy.tag}
                </span>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <strategy.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{strategy.name}</h3>
              </div>
              
              <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                {strategy.description}
              </p>
              
              <div className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                전략 상세 분석 보기 →
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
