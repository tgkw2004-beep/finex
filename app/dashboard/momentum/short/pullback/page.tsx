"use client"

import { useEffect, useState } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeft, Search, RefreshCw, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''

  const filteredData = selectedDateStr
    ? data.filter(r => r["기준봉 일자"] === selectedDateStr)
    : data

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

        // 고유 날짜 추출
        const allDates = [...new Set(rows.map(r => r["기준봉 일자"]))]
        setAvailableDates(new Set(allDates))

        // 최신 날짜를 디폴트 선택
        const latest = allDates.sort((a, b) => b.localeCompare(a))[0]
        if (latest) setSelectedDate(new Date(latest + 'T00:00:00'))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [nameFilter])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setPage(1)
    }
  }

  // 데이터 없는 날짜 비활성화
  const isDateDisabled = (date: Date) => {
    const str = format(date, 'yyyy-MM-dd')
    return !availableDates.has(str)
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

      {/* 날짜 피커 + 검색 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 종가매매와 동일한 Calendar Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate
                ? format(selectedDate, "PPP", { locale: ko })
                : <span>날짜를 선택하세요</span>
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              initialFocus
            />
          </PopoverContent>
        </Popover>

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

        <Button variant="outline" size="sm" onClick={fetchData} className="gap-1 h-9">
          <RefreshCw className="h-3.5 w-3.5" />
          새로고침
        </Button>
      </div>

      {/* 요약 카드 — 원래 내용(라벨 위, 숫자 아래), 패딩만 축소 */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-2">
          <div className="mb-0.5 text-sm text-muted-foreground">선별 종목 수</div>
          <div className="text-2xl font-bold">{stats.total}개</div>
        </Card>
        <Card className="p-2">
          <div className="mb-0.5 text-sm text-muted-foreground">대형주 (10%+)</div>
          <div className="text-2xl font-bold text-purple-600">{stats.large}개</div>
        </Card>
        <Card className="p-2">
          <div className="mb-0.5 text-sm text-muted-foreground">중소형 (15%+)</div>
          <div className="text-2xl font-bold text-red-500">{stats.mid}개</div>
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
