"use client"

import { useEffect, useState } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
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

const ITEMS_PER_PAGE = 10

export default function PullbackPage() {
  const [data, setData] = useState<PullbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [nameFilter, setNameFilter] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [dates, setDates] = useState<string[]>([])
  const [page, setPage] = useState(1)

  // 날짜 기준으로 필터링
  const filteredData = selectedDate
    ? data.filter(r => r["기준봉 일자"] === selectedDate)
    : data

  // 페이징
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const pagedData = filteredData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const stats = {
    total: filteredData.length,
    large: filteredData.filter(r => r["선정이유"].includes('대형주')).length,
    mid: filteredData.filter(r => r["선정이유"] === '상승률 15%이상').length,
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (nameFilter) params.set('name', nameFilter)
      const res = await fetch(`/api/momentum/pullback?${params}`)
      if (res.ok) {
        const json = await res.json()
        const rows: PullbackRow[] = json.data || []
        setData(rows)
        // 고유 날짜 정렬 (최신순)
        const allDates = [...new Set(rows.map(r => r["기준봉 일자"]))].sort((a, b) => b.localeCompare(a))
        setDates(allDates)
        // 최신 날짜 디폴트
        if (allDates.length > 0) setSelectedDate(allDates[0])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [nameFilter])

  // 날짜 바뀌면 페이지 1로 리셋
  const handleDateChange = (d: string) => {
    setSelectedDate(d)
    setPage(1)
  }

  return (
    <div className="space-y-3">
      <div>
        <Link href="/dashboard/momentum">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            모멘텀 전략으로 돌아가기
          </Button>
        </Link>
      </div>

      <AnalysisHeader
        title="눌림목전략(기준봉탐색)"
        description="강한 상승봉(기준봉) 발생 후 눌림목 매수 진입점을 포착합니다. 시가 대비 고가 상승률 기준으로 선정됩니다."
      />

      {/* 필터 + 달력 선택 */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* 날짜 달력 선택 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">기준봉 일자</label>
            <input
              type="date"
              value={selectedDate}
              min={dates[dates.length - 1] || ''}
              max={dates[0] || ''}
              onChange={e => handleDateChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* 구분선 */}
          <div className="h-7 w-px bg-border hidden sm:block" />

          {/* 종목명 검색 */}
          <div className="flex gap-2">
            <Input
              placeholder="종목명 검색..."
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setNameFilter(nameInput)}
              className="w-40 h-9"
            />
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setNameFilter(nameInput)}>
              <Search className="h-4 w-4" />
            </Button>
            {nameFilter && (
              <Button variant="ghost" size="sm" className="h-9" onClick={() => { setNameInput(''); setNameFilter('') }}>
                초기화
              </Button>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1 h-9 ml-auto">
            <RefreshCw className="h-3.5 w-3.5" />
            새로고침
          </Button>
        </div>
      </Card>

      {/* 요약 카드 (높이 축소) */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">선별 종목 수</span>
          <span className="text-lg font-bold">{stats.total}개</span>
        </Card>
        <Card className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">대형주 (10%+)</span>
          <span className="text-lg font-bold text-purple-600">{stats.large}개</span>
        </Card>
        <Card className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">중소형 (15%+)</span>
          <span className="text-lg font-bold text-red-500">{stats.mid}개</span>
        </Card>
      </div>

      {/* 테이블 */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-2.5 px-4 font-medium whitespace-nowrap">기준봉 일자</th>
                <th className="text-left py-2.5 px-4 font-medium whitespace-nowrap">종목코드</th>
                <th className="text-left py-2.5 px-4 font-medium whitespace-nowrap">종목명</th>
                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">시가</th>
                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">종가</th>
                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">상승률</th>
                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">거래대금</th>
                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">눌림목 지점</th>
                <th className="text-left py-2.5 px-4 font-medium whitespace-nowrap">선정이유</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-16 text-center text-muted-foreground">데이터 로딩 중...</td></tr>
              ) : pagedData.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center text-muted-foreground">조건에 맞는 종목이 없습니다.</td></tr>
              ) : pagedData.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-4 text-muted-foreground whitespace-nowrap">{row["기준봉 일자"]}</td>
                  <td className="py-2 px-4 font-mono text-xs">
                    <Link href={`/dashboard/stock/${row["종목코드"]}`} className="text-primary hover:underline">
                      {row["종목코드"]}
                    </Link>
                  </td>
                  <td className="py-2 px-4 font-semibold whitespace-nowrap">
                    <Link href={`/dashboard/stock/${row["종목코드"]}`} className="hover:text-primary transition-colors">
                      {row["종목명"]}
                    </Link>
                  </td>
                  <td className="py-2 px-4 text-right font-mono">{formatPrice(row["시가"])}</td>
                  <td className="py-2 px-4 text-right font-mono">{formatPrice(row["종가"])}</td>
                  <td className="py-2 px-4 text-right font-bold text-red-500">
                    ▲ {Number(row["상승률"]).toFixed(2)}%
                  </td>
                  <td className="py-2 px-4 text-right text-muted-foreground whitespace-nowrap">
                    {formatTradeValue(row["거래대금"])}
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-blue-500 font-semibold">
                    {formatPrice(row["눌림목 지점"])}
                  </td>
                  <td className="py-2 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REASON_COLORS[row["선정이유"]] || ''}`}>
                      {row["선정이유"]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredData.length)} / {filteredData.length}개
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(1)} disabled={page === 1}>
                <ChevronLeft className="h-3 w-3" /><ChevronLeft className="h-3 w-3 -ml-2" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="text-xs px-2">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                <ChevronRight className="h-3 w-3" /><ChevronRight className="h-3 w-3 -ml-2" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
