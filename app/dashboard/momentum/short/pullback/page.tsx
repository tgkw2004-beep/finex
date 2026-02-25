"use client"

import { useEffect, useState } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, RefreshCw } from "lucide-react"
import Link from "next/link"

interface PullbackRow {
  "기준봉 일자": string
  "종목코드": string
  "종목명": string
  "시가": number
  "종가": number
  "상승률": number
  "거래대금": number
  "선정이유": string
  "눌림목 지점": number
}

function formatTradeValue(val: number) {
  if (!val) return '-'
  const eok = Math.round(val / 100000000)
  if (eok >= 10000) return `${(eok / 10000).toFixed(1)}조`
  return `${eok.toLocaleString()}억`
}

function formatPrice(val: number) {
  if (!val) return '-'
  return val.toLocaleString()
}

const REASON_COLORS: Record<string, string> = {
  '대형주&상승률 10%이상': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  '상승률 15%이상': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  '단순 상승률 15%이상': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
}

export default function PullbackPage() {
  const [data, setData] = useState<PullbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [nameFilter, setNameFilter] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  // Get distinct dates from data
  const dates = [...new Set(data.map(r => r["기준봉 일자"]))].sort((a, b) => b.localeCompare(a))
  const filteredData = selectedDate
    ? data.filter(r => r["기준봉 일자"] === selectedDate)
    : data

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (nameFilter) params.set('name', nameFilter)
      const res = await fetch(`/api/momentum/pullback?${params}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data || [])
        // default to latest date
        const allDates = [...new Set((json.data || []).map((r: PullbackRow) => r["기준봉 일자"]))].sort((a, b) => (b as string).localeCompare(a as string))
        if (allDates.length > 0) setSelectedDate(allDates[0] as string)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [nameFilter])

  const stats = {
    total: filteredData.length,
    large: filteredData.filter(r => r["선정이유"].includes('대형주')).length,
    mid: filteredData.filter(r => r["선정이유"] === '상승률 15%이상').length,
  }

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Link href="/dashboard/momentum">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            모멘텀 전략으로 돌아가기
          </Button>
        </Link>
      </div>

      <AnalysisHeader
        title="눌림목 전략 — 기준봉 탐색"
        description="강한 상승봉(기준봉) 발생 후 눌림목 매수 진입점을 포착합니다. 시가 대비 고가 상승률 기준으로 선정됩니다."
      />

      {/* 필터 */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex gap-2">
            <Input
              placeholder="종목명 검색..."
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setNameFilter(nameInput)}
              className="w-48"
            />
            <Button variant="outline" size="icon" onClick={() => setNameFilter(nameInput)}>
              <Search className="h-4 w-4" />
            </Button>
            {nameFilter && (
              <Button variant="ghost" size="sm" onClick={() => { setNameInput(''); setNameFilter('') }}>
                초기화
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            새로고침
          </Button>
        </div>
      </Card>

      {/* 날짜별 탭 */}
      {dates.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {dates.map(d => (
            <Button
              key={d}
              size="sm"
              variant={selectedDate === d ? "default" : "outline"}
              onClick={() => setSelectedDate(d)}
            >
              {d}
            </Button>
          ))}
        </div>
      )}

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="mb-1 text-sm text-muted-foreground">선별 종목 수</div>
          <div className="text-2xl font-bold">{stats.total}개</div>
        </Card>
        <Card className="p-4">
          <div className="mb-1 text-sm text-muted-foreground">대형주 (10%+)</div>
          <div className="text-2xl font-bold text-purple-600">{stats.large}개</div>
        </Card>
        <Card className="p-4">
          <div className="mb-1 text-sm text-muted-foreground">중소형 (15%+)</div>
          <div className="text-2xl font-bold text-red-500">{stats.mid}개</div>
        </Card>
      </div>

      {/* 테이블 */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium whitespace-nowrap">기준봉 일자</th>
                <th className="text-left py-3 px-4 font-medium whitespace-nowrap">종목코드</th>
                <th className="text-left py-3 px-4 font-medium whitespace-nowrap">종목명</th>
                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">시가</th>
                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">종가</th>
                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">상승률</th>
                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">거래대금</th>
                <th className="text-right py-3 px-4 font-medium whitespace-nowrap">눌림목 지점</th>
                <th className="text-left py-3 px-4 font-medium whitespace-nowrap">선정이유</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-16 text-center text-muted-foreground">데이터 로딩 중...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center text-muted-foreground">조건에 맞는 종목이 없습니다.</td></tr>
              ) : filteredData.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">{row["기준봉 일자"]}</td>
                  <td className="py-2.5 px-4 font-mono text-xs">
                    <Link href={`/dashboard/stock/${row["종목코드"]}`} className="text-primary hover:underline">
                      {row["종목코드"]}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 font-semibold whitespace-nowrap">
                    <Link href={`/dashboard/stock/${row["종목코드"]}`} className="hover:text-primary transition-colors">
                      {row["종목명"]}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">{formatPrice(row["시가"])}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{formatPrice(row["종가"])}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-red-500">
                    ▲ {Number(row["상승률"]).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-4 text-right text-muted-foreground whitespace-nowrap">
                    {formatTradeValue(row["거래대금"])}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-blue-500 font-semibold">
                    {formatPrice(row["눌림목 지점"])}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REASON_COLORS[row["선정이유"]] || ''}`}>
                      {row["선정이유"]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
