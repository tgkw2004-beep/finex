"use client"

import { useState, useEffect } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, BarChart3, TrendingUp, Activity, CalendarIcon } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface QuantItem {
  일자: string
  종목명: string
  업종: string
  open: number
  high: number
  low: number
  close: number
  "Prime-L": string | number
  전략: string
}

export default function QuantPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    omegaR: QuantItem[]
    alphaS: QuantItem[]
    sigmaT: QuantItem[]
    date: string | null
  }>({
    omegaR: [],
    alphaS: [],
    sigmaT: [],
    date: null
  })

  // Fetch latest available date
  useEffect(() => {
    async function fetchLatestDate() {
      try {
        const response = await fetch('/api/momentum/swing/quant?latest=true')
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
        const response = await fetch(`/api/momentum/swing/quant?date=${dateStr}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch Quant data:', error)
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

  const StockRow = ({ item }: { item: QuantItem }) => (
    <tr className="hover:bg-accent/30 transition-colors">
      <td className="py-3 px-4 text-right text-muted-foreground">{item.일자}</td>
      <td className="py-3 px-4">
        <span className="font-bold text-primary">{item.종목명}</span>
      </td>
      <td className="py-3 px-4 text-right text-xs">{item.업종 || "-"}</td>
      <td className="py-3 px-4 text-right">{Number(item.open || 0).toLocaleString()}</td>
      <td className="py-3 px-4 text-right font-medium text-red-500">{Number(item.high || 0).toLocaleString()}</td>
      <td className="py-3 px-4 text-right font-medium text-blue-500">{Number(item.low || 0).toLocaleString()}</td>
      <td className="py-3 px-4 text-right font-bold">{Number(item.close || 0).toLocaleString()}</td>
      <td className="py-3 px-4 text-right text-xs font-semibold text-orange-500">
        {item["Prime-L"] === '★' 
          ? '★' 
          : (item["Prime-L"] !== null && item["Prime-L"] !== undefined && item["Prime-L"] !== "" && !isNaN(Number(item["Prime-L"]))) 
            ? Number(item["Prime-L"]).toFixed(2) 
            : ""}
      </td>
    </tr>
  )

  const tableHeaders = ["일자", "종목명", "업종", "시가", "고가", "저가", "종가", "Prime-L"];

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
        title="퀀트매수 전략 분석"
        description="보린저 밴드 지표를 활용한 OMEGA-R, ALPHA-S, SIGMA-T 3가지 퀀트 전략을 분석합니다"
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
            />
          </PopoverContent>
        </Popover>

        <div className="text-sm text-muted-foreground">
          전체 결과: <span className="font-bold text-primary">{data.omegaR.length + data.alphaS.length + data.sigmaT.length}</span> 종목
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-muted-foreground">데이터를 분석하는 중...</Card>
      ) : (
        <Tabs defaultValue="omegaR" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="omegaR" className="gap-2">
              <Activity className="h-4 w-4" />
              OMEGA-R
            </TabsTrigger>
            <TabsTrigger value="alphaS" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              ALPHA-S
            </TabsTrigger>
            <TabsTrigger value="sigmaT" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              SIGMA-T
            </TabsTrigger>
          </TabsList>

          <TabsContent value="omegaR" className="space-y-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <p className="text-muted-foreground text-xs font-medium">오메가-R 전략 기반의 퀀트 분석 결과입니다.</p>
              <Badge variant="outline">{data.omegaR.length} 종목</Badge>
            </div>
            <StockTable headers={tableHeaders}>
              {data.omegaR.map((item, i) => (
                <StockRow key={i} item={item} />
              ))}
              {data.omegaR.length === 0 && (
                <tr>
                  <td colSpan={tableHeaders.length} className="py-12 text-center text-muted-foreground">해당 날짜에 분석된 종목이 없습니다.</td>
                </tr>
              )}
            </StockTable>
          </TabsContent>

          <TabsContent value="alphaS" className="space-y-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <p className="text-muted-foreground text-xs font-medium">알파-S 전략 기반의 퀀트 분석 결과입니다.</p>
              <Badge variant="outline">{data.alphaS.length} 종목</Badge>
            </div>
            <StockTable headers={tableHeaders}>
              {data.alphaS.map((item, i) => (
                <StockRow key={i} item={item} />
              ))}
              {data.alphaS.length === 0 && (
                <tr>
                  <td colSpan={tableHeaders.length} className="py-12 text-center text-muted-foreground">해당 날짜에 분석된 종목이 없습니다.</td>
                </tr>
              )}
            </StockTable>
          </TabsContent>

          <TabsContent value="sigmaT" className="space-y-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <p className="text-muted-foreground text-xs font-medium">시그마-T 전략 기반의 퀀트 분석 결과입니다.</p>
              <Badge variant="outline">{data.sigmaT.length} 종목</Badge>
            </div>
            <StockTable headers={tableHeaders}>
              {data.sigmaT.map((item, i) => (
                <StockRow key={i} item={item} />
              ))}
              {data.sigmaT.length === 0 && (
                <tr>
                  <td colSpan={tableHeaders.length} className="py-12 text-center text-muted-foreground">해당 날짜에 분석된 종목이 없습니다.</td>
                </tr>
              )}
            </StockTable>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
