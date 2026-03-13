"use client"

import { useState, useEffect } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Zap, Activity, Info, TrendingUp, Search } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StochasticItem {
  reco_date: string
  stock_name: string
  stock_code: string
  market_type: string
  industry_name: string
  f_score: number | null
}

export default function StochasticPage() {
  const [activeTab, setActiveTab] = useState("immediate")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<StochasticItem[]>([])

  const fetchData = async (type: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/momentum/trend/stochastic?type=${type}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch stochastic data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(activeTab)
  }, [activeTab])

  const StockTable = ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto rounded-xl border border-border/40 bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="py-3.5 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">추천일자</th>
            <th className="py-3.5 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">종목명</th>
            <th className="py-3.5 px-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">시장</th>
            <th className="py-3.5 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">WICS명</th>
            <th className="py-3.5 px-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">F-SCORE</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {children}
        </tbody>
      </table>
    </div>
  )

  const StockRow = ({ item }: { item: StochasticItem }) => (
    <tr 
      className="hover:bg-accent/30 transition-colors cursor-pointer group"
      onClick={() => window.location.href = `/dashboard/stock/${item.stock_code}`}
    >
      <td className="py-4 px-4 text-muted-foreground font-mono text-xs">{item.reco_date}</td>
      <td className="py-4 px-4">
        <div className="flex flex-col">
          <span className="font-bold text-primary group-hover:underlineDecoration-primary">{item.stock_name}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{item.stock_code}</span>
        </div>
      </td>
      <td className="py-4 px-4 text-center">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-[10px] font-black px-2 py-0.5 rounded-md border shadow-sm transition-all",
            item.market_type === 'KOSPI' || item.market_type === '코스피'
              ? "bg-rose-500 text-white border-rose-600 hover:bg-rose-600 shadow-rose-100" 
              : item.market_type === 'KOSDAQ' || item.market_type === '코스닥'
                ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600 shadow-blue-100"
                : "bg-slate-500 text-white border-slate-600 shadow-slate-100"
          )}
        >
          {item.market_type}
        </Badge>
      </td>
      <td className="py-4 px-4 text-xs font-medium text-muted-foreground">{item.industry_name || "-"}</td>
      <td className="py-4 px-4 text-center">
        {item.f_score !== null ? (
          <Badge className={`font-mono ${Number(item.f_score) >= 7 ? 'bg-emerald-500' : Number(item.f_score) >= 4 ? 'bg-amber-500' : 'bg-slate-400'}`}>
            {item.f_score}점
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
    </tr>
  )

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href="/dashboard/momentum">
          <Button variant="ghost" size="sm" className="gap-2 p-0 hover:bg-transparent -ml-1">
            <ArrowLeft className="h-4 w-4" />
            모멘텀 전략 메인으로 돌아가기
          </Button>
        </Link>
      </div>

      <AnalysisHeader
        title="스토캐스틱 분석 전략"
        description="기술적 지표의 정밀 결합을 통해 최적의 매수 타점과 추세 변곡점을 발굴합니다"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-muted/50 border border-border/40">
          <TabsTrigger value="immediate" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
            <Zap className="h-4 w-4" />
            즉각적 매수 타점
          </TabsTrigger>
          <TabsTrigger value="inflection" className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-300">
            <Activity className="h-4 w-4" />
            대추세 변곡점 탈출
          </TabsTrigger>
        </TabsList>

        <div className="mb-6 flex items-start gap-4 p-4 rounded-xl bg-accent/30 border border-dashed border-border/60">
          <div className="p-2 rounded-lg bg-background shadow-sm mt-1">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold">전략 가이드</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeTab === "immediate" 
                ? "MACD 히스토그램의 급감 후 반등 시점과 RSI의 과매도 탈출 구간을 결합한 매우 민감한 단기 신호입니다. 주가가 상방으로 튀어오를 준비가 된 시점을 포착합니다."
                : "긴 조정의 끝에서 MACD 골든크로스와 RSI 지지선을 동시 상향 돌파하는 강력한 바닥 확인 신호입니다. 대세 상승으로의 추세 전환이 예상되는 구간을 감지합니다."
              }
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono px-3">검색 결과: {data.length}종목</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium italic">
                <Search className="h-3 w-3" />
                최근 5영업일 이내 발생한 유효 신호만 표시됩니다
              </p>
            </div>
            
            <StockTable>
              {data.map((item, i) => (
                <StockRow key={`${item.stock_code}-${i}`} item={item} />
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-muted-foreground italic">현재 조건을 충족하는 분석 종목이 없습니다.</td>
                </tr>
              )}
            </StockTable>
          </div>
        )}
      </Tabs>
    </div>
  )
}
