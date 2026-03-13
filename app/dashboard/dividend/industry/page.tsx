"use client"

import { useEffect, useState } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, PieChart, Info } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface IndustryDividend {
  rank: number
  industry_name: string
  avg_dividend_yield: number
}

export default function IndustryDividendPage() {
  const [data, setData] = useState<IndustryDividend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/dividend/industry")
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(json => setData(json.data || []))
      .catch(() => setError("데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href="/dashboard/dividend">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            배당주 분석으로 돌아가기
          </Button>
        </Link>
      </div>

      <AnalysisHeader
        title="산업별 배당분석"
        description="최근 3년간 가장 높은 배당 성향을 보인 산업군 TOP 10을 분석합니다"
      />

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/40">
          <Info className="h-4 w-4 text-primary" />
          <span>최근 3개년(실적 기준) 동안의 보통주 현금 배당 데이터를 기반으로 업종별 평균 배당률을 산출했습니다.</span>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-12 text-center text-muted-foreground">{error}</Card>
        ) : (
          <div className="grid gap-6">
            <Card className="overflow-hidden border-border/40">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 w-20 text-center">순위</th>
                      <th className="px-6 py-4">산업군 (WICS 대분류)</th>
                      <th className="px-6 py-4 text-right">3년 평균 배당률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.map((item) => (
                      <tr key={item.rank} className="group hover:bg-accent/30 transition-colors">
                        <td className="px-6 py-5 text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shadow-sm",
                            item.rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {item.rank}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                                <PieChart className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-base">{item.industry_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xl font-black text-primary tabular-nums tracking-tight">
                                {Number(item.avg_dividend_yield).toFixed(2)}%
                            </span>
                            <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-1000" 
                                    style={{ width: `${Math.min(Number(item.avg_dividend_yield) * 10, 100)}%` }} 
                                />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground font-medium">
                          분석 가능한 산업 데이터가 존재하지 않습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="p-5 bg-primary/5 border-primary/20 shadow-none">
                    <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                        <Badge className="bg-primary text-primary-foreground">Insight 01</Badge>
                        최고 배당 산업
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        현재 상위권을 기록 중인 <span className="text-primary font-bold">"{data[0]?.industry_name}"</span> 산업군은 역사적으로 가장 안정적인 현금 흐름을 주주에게 환원하고 있습니다.
                    </p>
                </Card>
                <Card className="p-5 bg-accent/50 border-border/40 shadow-none">
                    <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="border-primary text-primary">Insight 02</Badge>
                        업종별 차별화
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        상위 10개 업종의 평균 배당률 차이는 약 <span className="text-foreground font-bold">{(Number(data[0]?.avg_dividend_yield) - Number(data[9]?.avg_dividend_yield)).toFixed(2)}%p</span> 수준으로 나타납니다.
                    </p>
                </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
