"use client"

import { useState, useEffect } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Users, Repeat, CalendarIcon } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface PensionItem {
  추천일자?: string
  일자?: string
  종목명: string
  종목코드: string
  시장구분: string
  WICS명?: string
  wics명?: string
}

export default function PensionPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({})
  const [data, setData] = useState<{
    representative: PensionItem[]
    consecutive: PensionItem[]
    date: string | null
  }>({
    representative: [],
    consecutive: [],
    date: null
  })

  // Fetch calendar stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/momentum/trend/pension?stats=true')
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
        const response = await fetch('/api/momentum/trend/pension?latest=true')
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
        const response = await fetch(`/api/momentum/trend/pension?date=${dateStr}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch Pension data:', error)
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

  const StockRow = ({ item }: { item: PensionItem }) => (
    <tr 
      className="hover:bg-accent/30 transition-colors cursor-pointer"
      onClick={() => window.location.href = `/dashboard/stock/${item.종목코드}`}
    >
      <td className="py-3 px-4 text-right text-muted-foreground">{item.추천일자 || item.일자}</td>
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
            item.시장구분 === 'KOSPI' || item.시장구분 === '코스피'
              ? "bg-rose-500 text-white border-rose-600 hover:bg-rose-600 shadow-rose-100" 
              : item.시장구분 === 'KOSDAQ' || item.시장구분 === '코스닥'
                ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600 shadow-blue-100"
                : "bg-slate-500 text-white border-slate-600 shadow-slate-100"
          )}
        >
          {item.시장구분}
        </Badge>
      </td>
      <td className="py-3 px-4 text-right text-xs font-medium">{item.WICS명 || item.wics명 || "-"}</td>
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
        title="연기금 수급분석 전략"
        description="연기금의 강력한 수급이 유입되는 종목을 추세 필터와 함께 분석합니다"
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
          전체 결과: <span className="font-bold text-primary">{data.representative.length + data.consecutive.length}</span> 종목
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-muted-foreground">데이터를 분석하는 중...</Card>
      ) : (
        <Tabs defaultValue="representative" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="representative" className="gap-2">
              <Users className="h-4 w-4" />
              순매수량 대표종목
            </TabsTrigger>
            <TabsTrigger value="consecutive" className="gap-2">
              <Repeat className="h-4 w-4" />
              3일 연속 순매수
            </TabsTrigger>
          </TabsList>

          <TabsContent value="representative" className="space-y-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <p className="text-muted-foreground text-xs font-medium">최근 연기금 순매수량이 급증한 대표 종목입니다.</p>
              <Badge variant="outline">{data.representative.length} 종목</Badge>
            </div>
            <StockTable headers={["추천일자", "종목명", "시장", "WICS분류"]}>
              {data.representative.map((item, i) => (
                <StockRow key={i} item={item} />
              ))}
              {data.representative.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">해당 날짜에 분석된 종목이 없습니다.</td>
                </tr>
              )}
            </StockTable>
          </TabsContent>

          <TabsContent value="consecutive" className="space-y-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <p className="text-muted-foreground text-xs font-medium">연기금이 3일 이상 연속으로 매수한 우량 종목입니다.</p>
              <Badge variant="outline">{data.consecutive.length} 종목</Badge>
            </div>
            <StockTable headers={["일자", "종목명", "시장", "WICS분류"]}>
              {data.consecutive.map((item, i) => (
                <StockRow key={i} item={item} />
              ))}
              {data.consecutive.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">해당 날짜에 분석된 종목이 없습니다.</td>
                </tr>
              )}
            </StockTable>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
