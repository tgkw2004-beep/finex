"use client"

import { useState, useEffect } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Clock, Zap, CalendarIcon } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface Technique256Long {
  추천일자: string
  종목명: string
  종목코드: string
  시장구분명: string
  WICS명: string
  F_SCORE: number
}

export default function Technique256LongPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({})
  const [data, setData] = useState<{
    long1: Technique256Long[]
    long4: Technique256Long[]
  }>({
    long1: [],
    long4: []
  })

  // Fetch calendar stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/momentum/technique256long?stats=true')
        if (response.ok) {
          const result = await response.json()
          setDayCounts(result.stats || {})
        }
      } catch (error) {
        console.error('Failed to fetch calendar stats:', error)
      }
    }
    fetchStats()
  }, [])

  // Fetch latest available date
  useEffect(() => {
    async function fetchLatestDate() {
      try {
        const response = await fetch('/api/momentum/technique256long?latest=true')
        if (response.ok) {
          const result = await response.json()
          if (result.latestDate) {
            const [y, m, d] = result.latestDate.split('-').map(Number)
            setSelectedDate(new Date(y, m - 1, d))
          } else {
            setSelectedDate(new Date())
          }
        }
      } catch (error) {
        console.error('Failed to fetch latest date:', error)
        setSelectedDate(new Date())
      }
    }
    fetchLatestDate()
  }, [])

  // Fetch data when date changes
  useEffect(() => {
    async function fetchData() {
      if (!selectedDate) return

      try {
        setLoading(true)
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const response = await fetch(`/api/momentum/technique256long?date=${dateStr}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch 256 Long data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedDate])

  const StockTable = ({ children, headers }: { children: React.ReactNode, headers: string[] }) => (
    <div className="overflow-x-auto rounded-lg border border-border/40 bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={`py-3 px-4 text-xs font-medium text-muted-foreground ${i === 1 ? 'text-left' : 'text-right'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {children}
        </tbody>
      </table>
    </div>
  )

  const StockRow = ({ item }: { item: Technique256Long }) => (
    <tr 
      className="hover:bg-accent/30 transition-colors cursor-pointer"
      onClick={() => window.location.href = `/dashboard/stock/${item.종목코드}`}
    >
      <td className="py-3 px-4 text-right text-muted-foreground">{item.추천일자}</td>
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span className="font-bold text-primary">{item.종목명}</span>
          <span className="text-[10px] text-muted-foreground">{item.종목코드}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-[10px] font-black px-2 py-0.5 rounded-md border shadow-sm transition-all",
            item.시장구분명 === 'KOSPI' || item.시장구분명 === '코스피'
              ? "bg-rose-500 text-white border-rose-600 hover:bg-rose-600 shadow-rose-100" 
              : item.시장구분명 === 'KOSDAQ' || item.시장구분명 === '코스닥'
                ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600 shadow-blue-100"
                : "bg-slate-500 text-white border-slate-600 shadow-slate-100"
          )}
        >
          {item.시장구분명}
        </Badge>
      </td>
      <td className="py-3 px-4 text-right text-xs font-medium">{item.WICS명 || "-"}</td>
      <td className="py-3 px-4 text-right font-bold text-blue-500">{item.F_SCORE || "0"}</td>
    </tr>
  )

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href="/dashboard/momentum">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            모멘텀 전략으로 돌아가기
          </Button>
        </Link>
      </div>

      <AnalysisHeader
        title="256기법 분석 (장기)"
        description="수급선 및 생명선이 60일선을 돌파하는 추세 반전 지점을 포착합니다"
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
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
              {selectedDate ? format(selectedDate, "PPP", { locale: ko }) : <span>날짜 선택...</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              dayCounts={dayCounts}
            />
          </PopoverContent>
        </Popover>

        <div className="text-sm text-muted-foreground">
          전체 결과: <span className="font-bold text-primary">{data.long1.length + data.long4.length}</span> 종목
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-muted-foreground">데이터를 분석하는 중...</Card>
      ) : (
        <Tabs defaultValue="long1" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="long1" className="gap-2">
              <Clock className="h-4 w-4" />
              수급선 장악 (3일선)
            </TabsTrigger>
            <TabsTrigger value="long4" className="gap-2">
              <Zap className="h-4 w-4" />
              생명선 장악 (5일선)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="long1" className="space-y-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <p className="text-muted-foreground">3일선이 60일선을 돌파하며 추세 반전을 알리는 종목입니다.</p>
              <Badge variant="outline">{data.long1.length} 종목</Badge>
            </div>
            <StockTable headers={["추천일자", "종목명", "시장", "WICS분류", "F-Score"]}>
              {data.long1.map((item, i) => (
                <StockRow key={i} item={item} />
              ))}
              {data.long1.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">해당 날짜에 분석된 종목이 없습니다.</td>
                </tr>
              )}
            </StockTable>
          </TabsContent>

          <TabsContent value="long4" className="space-y-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <p className="text-muted-foreground">5일선이 60일선을 돌파하며 추세 반전의 서막을 알리는 종목입니다.</p>
              <Badge variant="outline">{data.long4.length} 종목</Badge>
            </div>
            <StockTable headers={["추천일자", "종목명", "시장", "WICS분류", "F-Score"]}>
              {data.long4.map((item, i) => (
                <StockRow key={i} item={item} />
              ))}
              {data.long4.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">해당 날짜에 분석된 종목이 없습니다.</td>
                </tr>
              )}
            </StockTable>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
