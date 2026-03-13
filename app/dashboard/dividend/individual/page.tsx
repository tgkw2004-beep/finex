"use client"

import { useEffect, useState } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SafeHighDividendStock {
  rank: number
  stock_name: string
  stock_code: string
  stock_type: string
  avg_dividend_yield: number
  avg_eps: number
  avg_payout_ratio: number
  std_payout_ratio: number
  market_cap_eok: number
  relative_volatility: number
}

interface GrowthDividendStock {
  rank: number
  stock_name: string
  stock_code: string
  stock_type: string
  dps_growth_rate: number
  avg_dividend_yield: number
  std_payout_ratio: number
  undervaluation_eval: string | null
}

const ITEMS_PER_PAGE = 10

// ─── Pagination Helper ────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between mt-3">
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onPrev} disabled={page === 1}>
        <ChevronLeft className="h-3 w-3 mr-1" /> 이전
      </Button>
      <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onNext} disabled={page === totalPages}>
        다음 <ChevronRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  )
}

// ─── 안전형 고배당주 TOP 20 ────────────────────────────────────────────────────

function SafeHighDividendTab() {
  const [data, setData] = useState<SafeHighDividendStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/dividend/safe-high")
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(json => setData(json.data || []))
      .catch(() => setError("데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="w-full h-[500px]" />
  if (error) return <div className="flex items-center justify-center h-40 text-muted-foreground">{error}</div>
  if (data.length === 0) return <div className="flex items-center justify-center h-40 text-muted-foreground">해당 조건의 종목이 없습니다.</div>

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
  const current = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        조건: 배당성향 30~60% · 배당성향 변동성 &lt;20 · 주가변동성 &lt;0.15 · EPS &gt;2,000원 · 3년 연속 배당 · 시가총액 3,000억↑ · 보통주
      </p>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium w-12 text-center">순위</th>
                <th className="px-4 py-3 font-medium">종목명</th>
                <th className="px-4 py-3 font-medium text-right">평균 배당률</th>
                <th className="px-4 py-3 font-medium text-right">평균 EPS</th>
                <th className="px-4 py-3 font-medium text-right">평균 배당성향</th>
                <th className="px-4 py-3 font-medium text-right">배당성향 변동성</th>
                <th className="px-4 py-3 font-medium text-right">시가총액(억)</th>
                <th className="px-4 py-3 font-medium text-right">주가변동성</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {current.map((row) => (
                <tr
                  key={row.rank}
                  className="hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/stock/${row.stock_code}`)}
                >
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums text-center">{row.rank}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col">
                        <span className="font-bold text-primary">{row.stock_name}</span>
                        <span className="text-[10px] text-muted-foreground">{row.stock_code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-red-500 font-semibold">
                    {Number(row.avg_dividend_yield).toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {Number(row.avg_eps).toLocaleString()}원
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {Number(row.avg_payout_ratio).toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {Number(row.std_payout_ratio).toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-xs">
                    {Number(row.market_cap_eok).toLocaleString()}억
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground text-xs">
                    {Number(row.relative_volatility).toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage(p => Math.max(1, p - 1))}
        onNext={() => setPage(p => Math.min(totalPages, p + 1))}
      />
    </div>
  )
}

// ─── 배당 성장주 TOP 100 ──────────────────────────────────────────────────────

function GrowthDividendTab() {
  const [data, setData] = useState<GrowthDividendStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/dividend/growth")
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(json => setData(json.data || []))
      .catch(() => setError("데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="w-full h-[500px]" />
  if (error) return <div className="flex items-center justify-center h-40 text-muted-foreground">{error}</div>
  if (data.length === 0) return <div className="flex items-center justify-center h-40 text-muted-foreground">해당 조건의 종목이 없습니다.</div>

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
  const current = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        조건: 평균 배당률 ≥4% · 연평균 배당성장률 ≥5% · 3년 연속 배당 · 배당성향 변동성 ≤20 · 보통주
      </p>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium w-12 text-center">순위</th>
                <th className="px-4 py-3 font-medium">종목명</th>
                <th className="px-4 py-3 font-medium text-right">연평균 배당성장률</th>
                <th className="px-4 py-3 font-medium text-right">평균 배당률</th>
                <th className="px-4 py-3 font-medium text-right">배당성향 변동성</th>
                <th className="px-4 py-3 font-medium">저평가 판단</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {current.map((row) => (
                <tr
                  key={row.rank}
                  className="hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/stock/${row.stock_code}`)}
                >
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums text-center">{row.rank}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col">
                        <span className="font-bold text-primary">{row.stock_name}</span>
                        <span className="text-[10px] text-muted-foreground">{row.stock_code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-green-600 dark:text-green-400 font-semibold">
                    +{Number(row.dps_growth_rate).toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-red-500 font-semibold">
                    {Number(row.avg_dividend_yield).toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {Number(row.std_payout_ratio).toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground italic">
                    {row.undervaluation_eval || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage(p => Math.max(1, p - 1))}
        onNext={() => setPage(p => Math.min(totalPages, p + 1))}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IndividualDividendPage() {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href="/dashboard/dividend">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            배당주 분석 메인으로 돌아가기
          </Button>
        </Link>
      </div>

      <AnalysisHeader
        title="개별 배당분석 전략"
        description="종목별 배당 지표와 성장성을 정밀하게 분석합니다"
      />

      <Tabs defaultValue="safe-high" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="safe-high">
            안전형 고배당주 TOP 20
          </TabsTrigger>
          <TabsTrigger value="growth">
            배당 성장주
          </TabsTrigger>
        </TabsList>

        <TabsContent value="safe-high" className="mt-0 space-y-4">
          <SafeHighDividendTab />
        </TabsContent>

        <TabsContent value="growth" className="mt-0 space-y-4">
          <GrowthDividendTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
