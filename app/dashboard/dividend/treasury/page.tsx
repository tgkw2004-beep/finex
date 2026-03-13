"use client"

import { useEffect, useState } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ArrowLeft, Search, Calendar, Shield, TrendingDown, Landmark, BarChart3, Info } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

const ITEMS_PER_PAGE = 15

export default function TreasuryPage() {
  const [mode, setMode] = useState("rank")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const router = useRouter()

  // Filters for mode 1
  const [year, setYear] = useState("2025")
  const [freq, setFreq] = useState("사업보고서")

  // Filters for mode 4
  const [startDate, setStartDate] = useState("2026-01-02")
  const [endDate, setEndDate] = useState("2026-03-10")

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ mode })
      if (mode === "rank") {
        params.append("year", year)
        params.append("freq", freq)
      } else if (mode === "defense") {
        params.append("startDate", startDate)
        params.append("endDate", endDate)
      }

      const res = await fetch(`/api/dividend/treasury?${params.toString()}`)
      if (!res.ok) throw new Error("데이터를 불러오지 못했습니다.")
      const json = await res.json()
      setData(json.data || [])
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [mode])

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
  const current = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // ─── Render Helpers ────────────────────────────────────────────────────────

  const renderPagination = () => {
    if (totalPages <= 1) return null
    return (
      <div className="flex items-center justify-between mt-4">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          <ChevronLeft className="h-4 w-4 mr-1" /> 이전
        </Button>
        <span className="text-xs text-muted-foreground font-medium">{page} / {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
          다음 <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    )
  }

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
        title="자사주 정밀 분석"
        description="자사주 보유 및 매입 트렌드를 통해 기업의 주가 방어 의지와 가치를 평가합니다"
      />

      <Tabs value={mode} onValueChange={setMode} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/30">
          <TabsTrigger value="rank" className="py-2.5 text-xs">보유비율 순위</TabsTrigger>
          <TabsTrigger value="market-cap" className="py-2.5 text-xs">시총 TOP 100</TabsTrigger>
          <TabsTrigger value="purchase" className="py-2.5 text-xs">실질 매입량</TabsTrigger>
          <TabsTrigger value="defense" className="py-2.5 text-xs">주가 방어지수</TabsTrigger>
          <TabsTrigger value="crash" className="py-2.5 text-xs">하락장 방어력</TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          {/* 모드별 필터 영역 */}
          {mode === "rank" && (
            <div className="flex flex-wrap gap-2 items-end bg-accent/30 p-4 rounded-xl border border-border/40">
              <div className="space-y-1.5 flex-1 min-w-[120px]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">조회 연도</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="h-9 bg-card">
                    <SelectValue placeholder="연도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {["2026", "2025", "2024", "2023", "2022", "2021"].map(y => <SelectItem key={y} value={y}>{y}년</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">보고서 구분</label>
                <Select value={freq} onValueChange={setFreq}>
                  <SelectTrigger className="h-9 bg-card">
                    <SelectValue placeholder="구분 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="사업보고서">사업보고서 (결산)</SelectItem>
                    <SelectItem value="3분기보고서">3분기보고서</SelectItem>
                    <SelectItem value="반기보고서">반기보고서</SelectItem>
                    <SelectItem value="1분기보고서">1분기보고서</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchData} className="h-9 gap-2">
                <Search className="h-4 w-4" /> 조회하기
              </Button>
            </div>
          )}

          {mode === "defense" && (
            <div className="flex items-center justify-between bg-accent/30 p-4 rounded-xl border border-border/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">분석 대상 기간</h4>
                  <p className="text-xs text-muted-foreground font-mono">2026-01-02 ~ 2026-03-10</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic">
                <Info className="h-3.5 w-3.5" />
                해당 고정 기간 동안 시장 대비 초과수익률(Alpha)을 측정했습니다
              </div>
            </div>
          )}

          {loading ? (
            <Skeleton className="w-full h-[600px] rounded-xl" />
          ) : error ? (
            <div className="flex items-center justify-center h-60 border-2 border-dashed rounded-xl text-muted-foreground">{error}</div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl bg-muted/20 border-muted-foreground/20">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Search className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-bold text-muted-foreground">조회된 데이터가 없습니다</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">선택하신 연도 및 보고서 구분에 해당하는 내역이 아직 등록되지 않았을 수 있습니다.</p>
              <Button variant="outline" className="mt-6" onClick={() => { setYear("2024"); setFreq("사업보고서"); fetchData(); }}>
                직전 데이터(2024년 결산) 확인하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground font-medium">
                  {mode === 'rank' && "※ 자사주 보유 비중이 높은 보통주 상위 100개 종목입니다."}
                  {mode === 'market-cap' && "※ 전일 시가총액 상위 100개 종목의 자사주 규모를 분석합니다."}
                  {mode === 'purchase' && "※ 취득 대비 처분량을 제외한 순증가분 기준 상위 기업입니다."}
                  {mode === 'defense' && `※ ${startDate} ~ ${endDate} 기간 동안의 시장 방어력을 평가합니다.`}
                  {mode === 'crash' && "※ 코스피/코스닥 급락일 종목별 낙폭 강도를 그룹 분석한 결과입니다."}
                </p>
                <Badge variant="secondary" className="text-[10px]">총 {data.length}개 항목</Badge>
              </div>

              <Card className="overflow-hidden p-0 border-border/40 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {mode === 'rank' && (
                        <tr>
                          <th className="px-5 py-4 w-16 text-center">순위</th>
                          <th className="px-5 py-4">종목명</th>
                          <th className="px-5 py-4 text-right">발행주식수</th>
                          <th className="px-5 py-4 text-right">자기주식수</th>
                          <th className="px-5 py-4 text-right">보유비율</th>
                          <th className="px-5 py-4 text-center">기준일</th>
                        </tr>
                      )}
                      {mode === 'market-cap' && (
                        <tr>
                          <th className="px-5 py-4 w-16 text-center">시총순위</th>
                          <th className="px-5 py-4">종목명</th>
                          <th className="px-5 py-4 text-right">시가총액(억)</th>
                          <th className="px-5 py-4 text-right">보유비율</th>
                          <th className="px-5 py-4 text-right">자사주가치(억)</th>
                          <th className="px-5 py-4 text-center">기준일</th>
                        </tr>
                      )}
                      {mode === 'purchase' && (
                        <tr>
                          <th className="px-5 py-4 w-16 text-center">순위</th>
                          <th className="px-5 py-4">종목명</th>
                          <th className="px-5 py-4 text-right">실질매입량</th>
                          <th className="px-5 py-4 text-right">소각비율</th>
                          <th className="px-5 py-4 text-right">기말보유량</th>
                          <th className="px-5 py-4">취득방법</th>
                        </tr>
                      )}
                      {mode === 'defense' && (
                        <tr>
                          <th className="px-5 py-4 w-16 text-center">순위</th>
                          <th className="px-5 py-4">종목명</th>
                          <th className="px-5 py-4 text-right">종목수익률</th>
                          <th className="px-5 py-4 text-right">시장수익률</th>
                          <th className="px-5 py-4 text-right text-primary">방어지수(Alpha)</th>
                          <th className="px-5 py-4 text-right">자사주잔량</th>
                        </tr>
                      )}
                      {mode === 'crash' && (
                        <tr>
                          <th className="px-5 py-4">그룹 구분</th>
                          <th className="px-5 py-4 text-right">종목수</th>
                          <th className="px-5 py-4 text-right">시장 평균하락</th>
                          <th className="px-5 py-4 text-right font-bold">그룹 평균하락</th>
                          <th className="px-5 py-4 text-right text-primary font-black">방어력(Alpha)</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {current.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/40 cursor-default transition-colors">
                          {mode === 'rank' && (
                            <>
                              <td className="px-5 py-3.5 text-center text-muted-foreground font-mono">{row.rank}</td>
                              <td className="px-5 py-3.5 font-bold text-primary">{row.stock_name}</td>
                              <td className="px-5 py-3.5 text-right tabular-nums">{Number(row.total_shares).toLocaleString()}</td>
                              <td className="px-5 py-3.5 text-right tabular-nums">{Number(row.treasury_shares).toLocaleString()}</td>
                              <td className="px-5 py-3.5 text-right font-black text-rose-500">{row.treasury_ratio}%</td>
                              <td className="px-5 py-3.5 text-center text-[10px] text-muted-foreground">{row.base_date}</td>
                            </>
                          )}
                          {mode === 'market-cap' && (
                            <>
                              <td className="px-5 py-3.5 text-center text-muted-foreground font-mono">{row.mkt_rank}</td>
                              <td className="px-5 py-3.5 font-bold text-primary">{row.stock_name}</td>
                              <td className="px-5 py-3.5 text-right tabular-nums">{Number(row.market_cap_eok).toLocaleString()}억</td>
                              <td className="px-5 py-3.5 text-right font-semibold text-rose-500">{row.treasury_ratio}%</td>
                              <td className="px-5 py-3.5 text-right tabular-nums font-bold">{Math.round(row.treasury_value_eok).toLocaleString()}억</td>
                              <td className="px-5 py-3.5 text-center text-[10px] text-muted-foreground">{row.base_date}</td>
                            </>
                          )}
                          {mode === 'purchase' && (
                            <>
                              <td className="px-5 py-3.5 text-center text-muted-foreground font-mono">{row.rank}</td>
                              <td className="px-5 py-3.5 font-bold text-primary">{row.stock_name}</td>
                              <td className="px-5 py-3.5 text-right tabular-nums text-green-600 font-bold">+{Number(row.real_purchase).toLocaleString()}</td>
                              <td className="px-5 py-3.5 text-right font-semibold text-rose-500">{row.burn_ratio}%</td>
                              <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">{Number(row.final_holdings).toLocaleString()}</td>
                              <td className="px-5 py-3.5 text-xs text-muted-foreground">{row.purchase_method}</td>
                            </>
                          )}
                          {mode === 'defense' && (
                            <>
                              <td className="px-5 py-3.5 text-center text-muted-foreground font-mono">{row.rank}</td>
                              <td className="px-5 py-3.5 font-bold text-primary">{row.stock_name}</td>
                              <td className="px-5 py-3.5 text-right tabular-nums font-semibold">{row.stock_return}%</td>
                              <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">{row.market_return}%</td>
                              <td className="px-5 py-3.5 text-right tabular-nums font-black text-blue-600">+{row.defense_alpha}%p</td>
                              <td className="px-5 py-3.5 text-right tabular-nums text-[10px] text-muted-foreground">{Number(row.treasury_shares).toLocaleString()}</td>
                            </>
                          )}
                          {mode === 'crash' && (
                            <>
                              <td className="px-5 py-5 font-bold">
                                {row.group_type?.includes('(High)') ? <Badge className="bg-rose-500">{row.group_type}</Badge> : 
                                 row.group_type?.includes('(Low)') ? <Badge variant="outline">{row.group_type}</Badge> : 
                                 <Badge variant="secondary">{row.group_type || 'Group_C (Medium)'}</Badge>}
                              </td>
                              <td className="px-5 py-5 text-right tabular-nums">{row.stock_count}개</td>
                              <td className="px-5 py-5 text-right tabular-nums text-muted-foreground">{row.avg_market_fall}%</td>
                              <td className="px-5 py-5 text-right tabular-nums font-bold text-rose-600">{row.avg_group_fall}%</td>
                              <td className="px-5 py-5 text-right tabular-nums font-black text-primary text-xl">+{row.defense_alpha}%p</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              {renderPagination()}
            </div>
          )}
        </div>
      </Tabs>

      {/* Insight Section */}
      {!loading && !error && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-5 bg-primary/5 border-primary/20 shadow-none hover:bg-primary/10 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-primary text-primary-foreground"><Shield className="h-4 w-4" /></div>
                    <h4 className="text-sm font-bold tracking-tight">강력한 하방 경직성</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    자사주 비중이 높은 기업은 유통 주식수가 적고 기업의 매수 대기 수요가 있어 <span className="text-primary font-bold">낙폭 과대 시 복원력</span>이 뛰어납니다.
                </p>
            </Card>
            <Card className="p-5 bg-accent/50 border-border/40 shadow-none hover:bg-accent/70 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-foreground text-background"><BarChart3 className="h-4 w-4" /></div>
                    <h4 className="text-sm font-bold tracking-tight">주주 환원 진정성</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    실질 매입량과 더불어 <span className="font-bold underline">소각 여부</span>를 반드시 확인하십시오. 단순 보유보다 소각을 병행하는 기업의 EPS 개선 속도가 빠릅니다.
                </p>
            </Card>
            <Card className="p-5 bg-muted/50 border-border/40 shadow-none hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-muted-foreground text-background"><Landmark className="h-4 w-4" /></div>
                    <h4 className="text-sm font-bold tracking-tight">가치 재평가(Re-rating)</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    전일 시총 대비 자사주 가치가 높은 종목은 사실상 <span className="font-bold">현금성 자산</span>을 많이 보유한 것과 같은 효과를 줍니다.
                </p>
            </Card>
        </div>
      )}
    </div>
  )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
