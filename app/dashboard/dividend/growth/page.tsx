"use client"

import { useEffect, useState } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

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

export default function GrowthDividendPage() {
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

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
  const current = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

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
        title="배당 성장주 TOP 100"
        description="배당 수익률과 함께 배당금이 꾸준히 성장하고 있는 종목들을 발굴합니다"
      />

      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          조건: 평균 배당률 ≥4% · 연평균 배당성장률 ≥5% · 3년 연속 배당 · 배당성향 변동성 ≤20 · 보통주
        </p>

        {loading ? (
          <Skeleton className="w-full h-[500px]" />
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground border rounded-lg bg-card">{error}</div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground border rounded-lg bg-card">해당 조건의 종목이 없습니다.</div>
        ) : (
          <>
            <div className="flex justify-end mb-2">
                <Badge variant="secondary" className="text-xs">전체 {data.length} 종목</Badge>
            </div>
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> 이전
                </Button>
                <span className="text-xs text-muted-foreground font-medium">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  다음 <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
