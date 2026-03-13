"use client"

import { useState, useEffect } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { ArrowLeft, CalendarIcon, TrendingUp, Info } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ReboundStock {
  date_str: string
  stock_name: string
  theme_names: string
  stock_info: string
  val_top300: boolean | string
  whol_smtn_ntby_tr_pbmn: number
  supply_total: number
  inv_strat_dtl: string
  abc_all: boolean
  prg_accum_signal: boolean
  stock_code: string
  close: number
  trade_value: number
  val_rank: number
  supply_buy: string
  z_score: number
}

export default function ReboundPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [data, setData] = useState<ReboundStock[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch latest available date
  useEffect(() => {
    async function fetchLatestDate() {
      try {
        const response = await fetch('/api/momentum/rebound?latest=true')
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
        const response = await fetch(`/api/momentum/rebound?date=${dateStr}`)

        if (response.ok) {
          const result = await response.json()
          setData(result.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch rebound data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedDate])

  const formatNumber = (num: any) => Number(num || 0).toLocaleString() || '-'
  const formatAmount = (val: any) => (Number(val || 0) / 100000000).toFixed(0) + '억'

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
        title="단기 반등 수급 매매 전략"
        description="MACD 바닥 통과 및 수급 유입이 확인된 단기 반등 후보 종목을 탐지합니다"
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

        {data.length > 0 && (
          <div className="text-sm text-muted-foreground">
            검색 결과: <span className="font-bold text-primary">{data.length}</span> 종목
          </div>
        )}
      </div>

      {loading ? (
        <Card className="p-12 text-center text-muted-foreground">데이터를 불러오는 중...</Card>
      ) : data.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">해당 날짜에 데이터가 없습니다.</Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/40 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="py-3 px-4 text-left font-medium">종목/테마</th>
                <th className="py-3 px-4 text-right font-medium">현재가</th>
                <th className="py-3 px-4 text-right font-medium">거래대금</th>
                <th className="py-3 px-4 text-center font-medium">수급유입</th>
                <th className="py-3 px-4 text-center font-medium">ABC/매집</th>
                <th className="py-3 px-4 text-right font-medium">반등강도</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.map((stock, idx) => (
                <tr 
                  key={`${stock.stock_code}-${idx}`}
                  className="hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/stock/${stock.stock_code}`}
                >
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{stock.stock_name}</span>
                        <span className="text-xs text-muted-foreground">{stock.stock_code}</span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                        {stock.theme_names || "-"}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-medium">
                    {formatNumber(stock.close)}원
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-blue-500">{formatAmount(stock.trade_value)}</span>
                      <span className="text-[10px] text-muted-foreground">상위 {stock.val_rank}위</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <Badge variant={stock.supply_buy === '수급유입' ? "default" : "secondary"}>
                        {stock.supply_buy}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        기관외인: {formatAmount(stock.supply_total)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex justify-center gap-1">
                      {stock.abc_all && <Badge variant="outline" className="text-green-500 border-green-500">ABC</Badge>}
                      {stock.prg_accum_signal && <Badge variant="outline" className="text-blue-500 border-blue-500">매집</Badge>}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={cn("font-bold text-lg", Number(stock.z_score || 0) > 0 ? "text-red-500" : "text-blue-500")}>
                        {Number(stock.z_score || 0).toFixed(2)}
                      </span>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64">
                          <p className="text-xs leading-relaxed">
                            <strong>투자전략:</strong> {stock.inv_strat_dtl}
                          </p>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
