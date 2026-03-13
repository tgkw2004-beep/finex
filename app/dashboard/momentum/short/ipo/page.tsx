"use client"

import { useState, useEffect } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Clock, Zap, TrendingUp, BarChart } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface RecentListing {
  listing_date: string
  wics_name: string
  stock_name: string
  ipo_price: number
  supply_status: string
  stock_code: string
}

interface SupplyStrategy {
  date_str: string
  wics_name: string
  stock_name: string
  supply_cond: string
  closing_buy: string
  pullback_trend: string
  stock_code: string
}

interface MacdSignal {
  date_str: string
  wics_name: string
  stock_code: string
  stock_name: string
}

export default function IpoPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({})
  const [data, setData] = useState<{
    recentListings: RecentListing[]
    supplyStrategy: SupplyStrategy[]
    macdSignals: MacdSignal[]
    macdRsiSignals: MacdSignal[]
  }>({
    recentListings: [],
    supplyStrategy: [],
    macdSignals: [],
    macdRsiSignals: []
  })

  // Fetch calendar stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/momentum/ipo?stats=true')
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
        const response = await fetch('/api/momentum/ipo?latest=true')
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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
        const response = await fetch(`/api/momentum/ipo${dateStr ? `?date=${dateStr}` : ''}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch IPO data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedDate])

  const formatNumber = (num: any) => Number(num || 0).toLocaleString()

  const StockTable = ({ children, headers }: { children: React.ReactNode, headers: string[] }) => (
    <div className="overflow-x-auto rounded-lg border border-border/40 bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={`py-3 px-4 text-xs font-medium text-muted-foreground ${i === 0 ? 'text-left' : 'text-right'}`}>
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

  const StockRow = ({ name, code, children }: { name: string, code: string, children: React.ReactNode }) => (
    <tr 
      className="hover:bg-accent/30 transition-colors cursor-pointer"
      onClick={() => window.location.href = `/dashboard/stock/${code}`}
    >
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span className="font-bold text-primary">{name}</span>
          <span className="text-[10px] text-muted-foreground">{code}</span>
        </div>
      </td>
      {children}
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
        title="신규상장종목 분석"
        description="최근 6개월 내 상장된 종목들의 수급 및 기술적 지표를 다각도로 분석합니다"
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
          전체 결과: <span className="font-bold text-primary">{data.recentListings.length + data.supplyStrategy.length + data.macdSignals.length + data.macdRsiSignals.length}</span> 종목
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-muted-foreground">데이터를 분석하는 중...</Card>
      ) : (
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4">
            <TabsTrigger value="recent" className="gap-2 text-xs">
              <Clock className="h-3.5 w-3.5" />
              최근 상장
            </TabsTrigger>
            <TabsTrigger value="supply" className="gap-2 text-xs">
              <Zap className="h-3.5 w-3.5" />
              수급/눌림목
            </TabsTrigger>
            <TabsTrigger value="macd" className="gap-2 text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              MACD 추천
            </TabsTrigger>
            <TabsTrigger value="macd_rsi" className="gap-2 text-xs">
              <BarChart className="h-3.5 w-3.5" />
              MACD+RSI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <p className="text-muted-foreground">최근 6개월 내 상장된 종목들을 상장일 순으로 정렬합니다.</p>
              <Badge variant="outline">{data.recentListings.length} 종목</Badge>
            </div>
            <StockTable headers={["종목명", "상장일", "WICS분류", "공모가", "상장일 수급"]}>
              {data.recentListings.map((stock, i) => (
                <StockRow key={i} name={stock.stock_name} code={stock.stock_code}>
                  <td className="py-3 px-4 text-right">{stock.listing_date}</td>
                  <td className="py-3 px-4 text-right font-medium text-xs">{stock.wics_name || "-"}</td>
                  <td className="py-3 px-4 text-right font-medium">{formatNumber(stock.ipo_price)}원</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      {stock.supply_status.split('|').map((s, idx) => (
                        <Badge 
                          key={idx} 
                          variant={s.includes('▲') ? "default" : "secondary"}
                          className={`text-[10px] min-w-[50px] justify-center ${s.includes('▲') ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}`}
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </StockRow>
              ))}
            </StockTable>
          </TabsContent>

          <TabsContent value="supply" className="space-y-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <p className="text-muted-foreground">개인 매도 및 외국인/기관 동반 매수, 눌림목 가격 추세 조건을 분석합니다.</p>
              <Badge variant="outline">{data.supplyStrategy.length} 종목</Badge>
            </div>
            <StockTable headers={["종목명", "추천날짜", "WICS분류", "수급조건", "종가매매", "눌림목"]}>
              {data.supplyStrategy.map((stock, i) => (
                <StockRow key={i} name={stock.stock_name} code={stock.stock_code}>
                  <td className="py-3 px-4 text-right">{stock.date_str}</td>
                  <td className="py-3 px-4 text-right text-xs">{stock.wics_name}</td>
                  <td className="py-3 px-4 text-right">
                    {stock.supply_cond && <Badge variant="default" className="text-[10px]">{stock.supply_cond}</Badge>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {stock.closing_buy && <Badge variant="outline" className="text-[10px] border-orange-500 text-orange-500">{stock.closing_buy}</Badge>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {stock.pullback_trend && <Badge variant="outline" className="text-[10px] border-blue-500 text-blue-500">{stock.pullback_trend}</Badge>}
                  </td>
                </StockRow>
              ))}
            </StockTable>
          </TabsContent>

          <TabsContent value="macd" className="space-y-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <p className="text-muted-foreground">MACD 오실레이터 하락 후 반등 신호가 발생한 신규 상장 종목입니다.</p>
              <Badge variant="outline">{data.macdSignals.length} 종목</Badge>
            </div>
            <StockTable headers={["종목명", "발생일자", "WICS분류", "종목코드"]}>
              {data.macdSignals.map((stock, i) => (
                <StockRow key={i} name={stock.stock_name} code={stock.stock_code}>
                  <td className="py-3 px-4 text-right">{stock.date_str}</td>
                  <td className="py-3 px-4 text-right text-xs">{stock.wics_name || "-"}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{stock.stock_code}</td>
                </StockRow>
              ))}
            </StockTable>
          </TabsContent>

          <TabsContent value="macd_rsi" className="space-y-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <p className="text-muted-foreground">MACD 반등 신호와 RSI 과매도 구간(30 이하) 탈출 조건을 동시에 만족하는 종목입니다.</p>
              <Badge variant="outline">{data.macdRsiSignals.length} 종목</Badge>
            </div>
            <StockTable headers={["종목명", "발생일자", "WICS분류", "종목코드"]}>
              {data.macdRsiSignals.map((stock, i) => (
                <StockRow key={i} name={stock.stock_name} code={stock.stock_code}>
                  <td className="py-3 px-4 text-right">{stock.date_str}</td>
                  <td className="py-3 px-4 text-right text-xs">{stock.wics_name || "-"}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{stock.stock_code}</td>
                </StockRow>
              ))}
            </StockTable>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
