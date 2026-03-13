"use client"

import { useEffect, useState } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search, BarChart3, TrendingDown, Info, ChevronRight, LayoutGrid } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DividendPricePage() {
  const [industries, setIndustries] = useState<any[]>([])
  const [details, setDetails] = useState<any[]>([])
  const [loadingIndustries, setLoadingIndustries] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [freq, setFreq] = useState<string>("분기")

  // 1. 산업 요약 데이터 로드
  const fetchIndustries = async () => {
    setLoadingIndustries(true)
    try {
      const res = await fetch('/api/dividend/price?mode=industry')
      if (!res.ok) throw new Error("산업 데이터를 불러오지 못했습니다.")
      const json = await res.json()
      setIndustries(json.data || [])
      
      // 첫 번째 산업 자동 선택
      if (json.data && json.data.length > 0 && !selectedIndustry) {
        setSelectedIndustry(json.data[0].industry_name)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류 발생")
    } finally {
      setLoadingIndustries(false)
    }
  }

  // 2. 종목 상세 데이터 로드
  const fetchDetails = async () => {
    if (!selectedIndustry) return
    setLoadingDetails(true)
    try {
      const params = new URLSearchParams({
        mode: 'details',
        freq: freq,
        industry: selectedIndustry
      })
      const res = await fetch(`/api/dividend/price?${params.toString()}`)
      if (!res.ok) throw new Error("상세 데이터를 불러오지 못했습니다.")
      const json = await res.json()
      setDetails(json.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetails(false)
    }
  }

  useEffect(() => {
    fetchIndustries()
  }, [])

  useEffect(() => {
    fetchDetails()
  }, [selectedIndustry, freq])

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href="/dashboard/dividend">
          <Button variant="ghost" size="sm" className="gap-2 p-0 hover:bg-transparent -ml-1">
            <ArrowLeft className="h-4 w-4" />
            배당주 분석 메인으로 돌아가기
          </Button>
        </Link>
      </div>

      <AnalysisHeader
        title="주가별 배당 종목 추천"
        description="현재 주가가 연 평균 및 최근 평균 대비 낮은 고배당주를 업종별로 추천합니다"
      />

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-12">
        {/* 좌측: 산업별 요약 */}
        <div className="xl:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              산업별 요약 (저평가 종목 수)
            </h3>
            <Badge variant="outline" className="text-[10px]">기준: 배당률 4% 이상</Badge>
          </div>
          
          <Card className="overflow-hidden border-border/40 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">산업명</th>
                    <th className="px-4 py-3 text-right">분기대비</th>
                    <th className="px-4 py-3 text-right">월대비</th>
                    <th className="px-4 py-3 text-right">산업 평균주가</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loadingIndustries ? (
                    Array(10).fill(0).map((_, i) => (
                      <tr key={i}><td colSpan={4} className="p-4"><Skeleton className="h-4 w-full" /></td></tr>
                    ))
                  ) : industries.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-muted-foreground">데이터가 없습니다.</td></tr>
                  ) : (
                    industries.map((ind, idx) => (
                      <tr 
                        key={idx} 
                        className={`hover:bg-primary/5 cursor-pointer transition-colors ${selectedIndustry === ind.industry_name ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                        onClick={() => setSelectedIndustry(ind.industry_name)}
                      >
                        <td className="px-4 py-3 font-bold text-xs truncate max-w-[120px]">{ind.industry_name}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant={ind.count_low_quarter > 0 ? "default" : "secondary"} className="font-mono">{ind.count_low_quarter}개</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant={ind.count_low_month > 0 ? "outline" : "secondary"} className="font-mono border-primary/30 text-primary">{ind.count_low_month}개</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-[10px] text-muted-foreground font-mono">
                          {Number(ind.avg_price_year).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* 우측: 종목별 상세 */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              {selectedIndustry} 상세 종목 리스트
            </h3>
            
            <Tabs value={freq} onValueChange={setFreq} className="w-auto">
              <TabsList className="h-8 p-1 bg-muted/50 border border-border/40">
                <TabsTrigger value="분기" className="text-[10px] px-3 h-6">분기 기준</TabsTrigger>
                <TabsTrigger value="월" className="text-[10px] px-3 h-6">월 기준</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card className="overflow-hidden border-border/40 shadow-sm min-h-[500px]">
            {loadingDetails ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : !selectedIndustry ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
                <p>산업을 선택해주세요</p>
              </div>
            ) : details.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Info className="h-12 w-12 mb-4 opacity-20" />
                <p>해당 조건에 부합하는 종목이 없습니다</p>
                <p className="text-xs mt-1">(주가가 연/평균 대비 낮고 배당 4% 이상)</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-4">종목명</th>
                      <th className="px-4 py-4 text-right">전일주가</th>
                      <th className="px-4 py-4 text-right bg-primary/5 text-primary">기준평균({details[0]?.period_name})</th>
                      <th className="px-4 py-4 text-right">연평균</th>
                      <th className="px-4 py-4 text-right">배당률</th>
                      <th className="px-4 py-4 text-right">DPS(전년)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {details.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-primary">{row.stock_name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{row.stock_code}</div>
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums font-semibold">
                          {Number(row.current_price).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums bg-primary/5 font-bold text-rose-500">
                          {Number(row.avg_price_period).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
                          {Number(row.avg_price_year).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-rose-500">
                          {row.dividend_yield}%
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-xs">
                          {Number(row.dps).toLocaleString()}원
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          
          <div className="p-4 bg-muted/20 rounded-xl border border-dashed border-border/60">
            <h5 className="text-[10px] font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              추천 로직 안내림
            </h5>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              1. {freq} 평균 주가 및 연 평균 주가보다 현재가(전일 종가)가 모두 낮아야 합니다.<br />
              2. 배당 수익률이 4% 이상이며, 배당 성향이 양수인 우량 종목을 선별합니다.<br />
              3. 산업별로 그룹화하여 섹터 내 저평가 기회를 한눈에 파악할 수 있도록 제공합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
