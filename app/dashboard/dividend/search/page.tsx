"use client"

import { useEffect, useState } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ArrowLeft, Search, Filter, History, Download, Info } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 25

export default function DividendSearchPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Filter options from API
  const [options, setOptions] = useState<{
    years: string[],
    markets: string[],
    stockTypes: string[],
    industries: string[]
  }>({
    years: [],
    markets: [],
    stockTypes: [],
    industries: []
  })

  // Selected filters
  const [year, setYear] = useState("ALL")
  const [market, setMarket] = useState("ALL")
  const [stockType, setStockType] = useState("ALL")
  const [divFreq, setDivFreq] = useState("ALL")
  const [industry, setIndustry] = useState("ALL")
  const [stockName, setStockName] = useState("")

  const fetchOptions = async () => {
    try {
      const res = await fetch('/api/dividend/search?mode=options')
      if (res.ok) {
        const json = await res.json()
        setOptions(json)
      }
    } catch (err) {
      console.error("Failed to fetch options", err)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        mode: 'search',
        year,
        market,
        stockType,
        divFreq,
        industry,
        stockName
      })
      const res = await fetch(`/api/dividend/search?${params.toString()}`)
      if (!res.ok) throw new Error("데이터를 불러오지 못했습니다.")
      const json = await res.json()
      setData(json.data || [])
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류 발생")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOptions()
    fetchData()
  }, [])

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
  const current = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const renderPagination = () => {
    if (totalPages <= 1) return null
    return (
      <div className="flex items-center justify-between mt-6">
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
        title="전체 배당 검색"
        description="과거부터 현재까지의 모든 배당 내역을 필터별로 상세히 검색하고 분석합니다"
      />

      {/* 필터 섹션 */}
      <Card className="p-6 border-border/40 shadow-sm bg-accent/5 overflow-visible">
        <div className="flex items-center gap-2 mb-4 text-primary">
          <Filter className="h-4 w-4" />
          <h3 className="text-sm font-bold">검색 필터 설정</h3>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 items-end">
          <div className="space-y-1.5 font-bold uppercase text-[10px] text-muted-foreground">
            <label>연도</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-9 bg-card">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 연도</SelectItem>
                {options.years.map(y => <SelectItem key={y} value={y}>{y}년</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 font-bold uppercase text-[10px] text-muted-foreground">
            <label>시장종류</label>
            <Select value={market} onValueChange={setMarket}>
              <SelectTrigger className="h-9 bg-card">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 시장</SelectItem>
                {options.markets.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 font-bold uppercase text-[10px] text-muted-foreground">
            <label>주식유형</label>
            <Select value={stockType} onValueChange={setStockType}>
              <SelectTrigger className="h-9 bg-card">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 유형</SelectItem>
                {options.stockTypes.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 font-bold uppercase text-[10px] text-muted-foreground">
            <label>배당주기</label>
            <Select value={divFreq} onValueChange={setDivFreq}>
              <SelectTrigger className="h-9 bg-card">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 주기</SelectItem>
                <SelectItem value="연">연 배당</SelectItem>
                <SelectItem value="반기">반기 배당</SelectItem>
                <SelectItem value="분기">분기 배당</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 font-bold uppercase text-[10px] text-muted-foreground">
            <label>산업명</label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="h-9 bg-card">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 산업</SelectItem>
                {options.industries.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 font-bold uppercase text-[10px] text-muted-foreground">
            <label>종목명 검색</label>
            <div className="relative">
              <Input 
                placeholder="검색어 입력..." 
                className="h-9 pr-8" 
                value={stockName} 
                onChange={e => setStockName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchData()}
              />
              <Search className="h-4 w-4 absolute right-2.5 top-2.5 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={fetchData} className="gap-2 px-8">
            <History className="h-4 w-4" /> 통합 검색 실행
          </Button>
        </div>
      </Card>

      {/* 결과 테이블 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-2 py-0.5 font-mono">검색 결과: {data.length}건</Badge>
            {loading && <span className="text-[10px] text-muted-foreground animate-pulse">데이터를 조회하고 있습니다...</span>}
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
            <Download className="h-3.5 w-3.5" /> CSV 다운로드
          </Button>
        </div>

        <Card className="overflow-hidden border-border/40 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse table-fixed min-w-[2200px]">
              <thead className="bg-muted/50 font-bold text-muted-foreground uppercase tracking-wider">
                <tr className="border-b border-border/40">
                  <th className="px-4 py-4 w-28 sticky left-0 bg-muted/80 backdrop-blur z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">배당기준일</th>
                  <th className="px-4 py-4 w-28">지급일</th>
                  <th className="px-4 py-4 w-28">유통일</th>
                  <th className="px-4 py-4 w-40 sticky left-28 bg-muted/80 backdrop-blur z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">종목명</th>
                  <th className="px-4 py-4 w-28">종목코드</th>
                  <th className="px-4 py-4 w-32">산업명</th>
                  <th className="px-4 py-4 w-20 text-center">주기</th>
                  <th className="px-4 py-4 w-24">시장</th>
                  <th className="px-4 py-4 w-24">배당종류</th>
                  <th className="px-4 py-4 w-24">주식종류</th>
                  <th className="px-4 py-4 w-24 text-right bg-primary/5 text-primary">DPS(일반)</th>
                  <th className="px-4 py-4 w-24 text-right">DPS(차등)</th>
                  <th className="px-4 py-4 w-28 text-right text-rose-500 font-black">현금배당률</th>
                  <th className="px-4 py-4 w-24 text-right">주식배당률</th>
                  <th className="px-4 py-4 w-24 text-right">현금(차등)</th>
                  <th className="px-4 py-4 w-24 text-right">주식(차등)</th>
                  <th className="px-4 py-4 w-24 text-right">액면가</th>
                  <th className="px-4 py-4 w-20 text-center">결산월</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  Array(10).fill(0).map((_, i) => (
                    <tr key={i}><td colSpan={18} className="p-4"><Skeleton className="h-6 w-full" /></td></tr>
                  ))
                ) : error ? (
                  <tr><td colSpan={18} className="p-20 text-center text-red-500">{error}</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={18} className="p-20 text-center text-muted-foreground italic">검색 결과가 없습니다. 필터를 조정해 보세요.</td></tr>
                ) : (
                  current.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/40 transition-colors group">
                      <td className="px-4 py-3.5 font-mono text-muted-foreground sticky left-0 bg-card group-hover:bg-muted transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.02)]">{row.allocation_date}</td>
                      <td className="px-4 py-3.5 font-mono text-muted-foreground">{row.cash_date || '-'}</td>
                      <td className="px-4 py-3.5 font-mono text-muted-foreground">{row.stock_date || '-'}</td>
                      <td className="px-4 py-3.5 font-bold text-primary sticky left-28 bg-card group-hover:bg-muted transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.02)]">{row.stock_name}</td>
                      <td className="px-4 py-3.5 font-mono text-muted-foreground">{row.stock_code}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{row.industry_name}</td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 h-4 border-primary/20 text-primary">
                          {row.div_freq_name}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-[10px]">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-md border shadow-sm transition-all",
                            row.market_type === 'KOSPI' || row.market_type === '코스피'
                              ? "bg-rose-500 text-white border-rose-600 hover:bg-rose-600 shadow-rose-100" 
                              : row.market_type === 'KOSDAQ' || row.market_type === '코스닥'
                                ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600 shadow-blue-100"
                                : "bg-slate-500 text-white border-slate-600 shadow-slate-100"
                          )}
                        >
                          {row.market_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-[10px]">{row.dividend_type}</td>
                      <td className="px-4 py-3.5 text-[10px] text-muted-foreground">{row.stock_type}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold bg-primary/5 text-primary">
                        {row.dsp ? Number(row.dsp).toLocaleString() : '0'}원
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
                        {row.dsp_special ? Number(row.dsp_special).toLocaleString() : '0'}원
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-black text-rose-500">
                        {row.payout_ratio_cash ? `${Number(row.payout_ratio_cash).toFixed(2)}%` : '0%'}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
                        {row.payout_ratio_stock ? `${Number(row.payout_ratio_stock).toFixed(2)}%` : '0%'}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-[10px] text-muted-foreground">
                        {row.special_payout_cash || '0'}%
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-[10px] text-muted-foreground">
                        {row.special_payout_stock || '0'}%
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {row.face_value ? Number(row.face_value).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-center text-muted-foreground">{row.fiscal_month}월</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
        {renderPagination()}

        <div className="flex gap-4 items-center p-4 bg-muted/30 rounded-xl border border-border/40 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 font-bold"><Info className="h-3.5 w-3.5 text-primary" /> 알림 :</div>
          <p>종목별 '합산 DPS' 기준 상위 종목 및 최신 배당일 순으로 정렬되어 있습니다. (최대 1,000건 노출)</p>
        </div>
      </div>
    </div>
  )
}
