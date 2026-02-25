"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import { CandlestickChart } from "@/components/dashboard/candlestick-chart"
import { MACDChart } from "@/components/dashboard/macd-chart"
import { RSIChart } from "@/components/dashboard/rsi-chart"
import { VolumeChart } from "@/components/dashboard/volume-chart"
import { Minus, Plus } from "lucide-react"
import type { CompanyInfo } from "@/types/stock"
import NetworkGraphForce from "@/components/NetworkGraphForceV2"
import StockIndustryThemeTab from "@/components/dashboard/StockIndustryThemeTab"
import { FinancialBarChart } from "@/components/dashboard/FinancialBarChart"

// Helper to format currency
const formatCurrency = (value: number | string) => {
  if (!value || value === '정보 없음') return '-'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '-'

  // Value is in Won. Convert to Eok (100 Million) for display consistency with summary
  const eokWithDecimal = num / 100000000
  const eok = Math.floor(eokWithDecimal)

  const trillion = Math.floor(eok / 10000)
  const remainderEok = eok % 10000

  let result = ''
  if (trillion > 0) result += `${trillion}조 `
  if (remainderEok > 0) result += `${remainderEok}억`

  return result || '0'
}

// Define period constants for initial ranges
const INITIAL_RANGES = {
  D: 60,
  W: 24,
  M: 32,
  Y: 10,
} as const

// Define step sizes for zoom
const ZOOM_STEPS = {
  D: 10, // 10 days
  W: 5,  // 5 weeks
  M: 5,  // 5 months
  Y: 1,  // 1 year
} as const


export default function StockDetailPage() {
  const params = useParams()
  const symbol = params.symbol as string
  const [chartPeriod, setChartPeriod] = useState<"D" | "W" | "M" | "Y">("D")
  const [rangeCount, setRangeCount] = useState<number>(INITIAL_RANGES.D)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [priceData, setPriceData] = useState<any[]>([])
  const [financialData, setFinancialData] = useState<any>(null)
  const [companyDetailInfo, setCompanyDetailInfo] = useState<any>(null)
  const [financialSummary, setFinancialSummary] = useState<any>(null)
  const [financialYears, setFinancialYears] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [investorTradingData, setInvestorTradingData] = useState<any[]>([])
  const [networkData, setNetworkData] = useState<any>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!symbol) return

      try {
        setLoading(true)

        // Fetch company info
        const companyRes = await fetch(`/api/stocks/${symbol}`)
        if (companyRes.ok) {
          const companyData = await companyRes.json()
          setCompanyInfo(companyData.companyInfo)
        }

        // Fetch price data
        const pricesRes = await fetch(`/api/stocks/${symbol}/prices?limit=${rangeCount}`)
        if (pricesRes.ok) {
          const pricesData = await pricesRes.json()
          setPriceData(pricesData.prices || [])
        }

        // Fetch financial data
        const financialRes = await fetch(`/api/stocks/${symbol}/financials`)
        if (financialRes.ok) {
          const finData = await financialRes.json()
          setFinancialData(finData.financialData)
        }

        // Fetch company detail info
        const companyDetailRes = await fetch(`/api/stocks/${symbol}/company-info`)
        if (companyDetailRes.ok) {
          const detailData = await companyDetailRes.json()
          setCompanyDetailInfo(detailData)
        }

        // Fetch financial summary
        const financialSummaryRes = await fetch(`/api/stocks/${symbol}/financial-summary`)
        if (financialSummaryRes.ok) {
          const summaryData = await financialSummaryRes.json()
          setFinancialSummary(summaryData.data || [])
          setFinancialYears(summaryData.years || [])
          if (summaryData.years && summaryData.years.length > 0) {
            setSelectedYear(summaryData.years[0])
          }
        }

        // Fetch investor trading data
        const investorTradingRes = await fetch(`/api/stocks/${symbol}/investor-trading`)
        if (investorTradingRes.ok) {
          const investorData = await investorTradingRes.json()
          setInvestorTradingData(investorData.data || [])
        }

        // Fetch network data
        const networkRes = await fetch(`/api/stocks/${symbol}/network`)
        if (networkRes.ok) {
          const netData = await networkRes.json()
          setNetworkData(netData)
        }

      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [symbol, rangeCount])

  // Reset range when period changes
  const handlePeriodChange = (period: "D" | "W" | "M" | "Y") => {
    setChartPeriod(period)
    setRangeCount(INITIAL_RANGES[period])
  }

  // Zoom handlers
  const handleZoomIn = () => {
    setRangeCount((prev) => Math.max(5, prev - ZOOM_STEPS[chartPeriod]))
  }

  const handleZoomOut = () => {
    setRangeCount((prev) => prev + ZOOM_STEPS[chartPeriod])
  }

  // Stock data from API
  const latestPrice = priceData[priceData.length - 1]
  const previousPrice = priceData[priceData.length - 2]
  const priceChange = latestPrice && previousPrice ? latestPrice.close - previousPrice.close : 0
  const priceChangePercent = previousPrice ? (priceChange / previousPrice.close) * 100 : 0

  const stockInfo = {
    name: companyInfo?.stockName || "로딩 중...",
    code: symbol,
    price: latestPrice ? latestPrice.close.toLocaleString() : "로딩 중...",
    change: latestPrice ? (priceChange >= 0 ? "+" : "") + priceChange.toLocaleString() : "0",
    changePercent: latestPrice ? (priceChangePercent >= 0 ? "+" : "") + priceChangePercent.toFixed(2) + "%" : "0%",
    isPositive: priceChange >= 0,
  }


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold">{stockInfo.name}</h1>
          <span className="text-sm text-muted-foreground">{stockInfo.code}</span>
          <div className={`flex items-center gap-1 ${stockInfo.isPositive ? "text-red-500" : "text-blue-500"}`}>
            {stockInfo.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="font-semibold">{stockInfo.price}</span>
            <span className="text-sm">({stockInfo.changePercent})</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1">
          <TabsTrigger
            value="chart"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
          >
            종목정보
          </TabsTrigger>
          <TabsTrigger
            value="volume"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
          >
            거래량
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
          >
            재무정보
          </TabsTrigger>
          <TabsTrigger
            value="network"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
          >
            네트워크
          </TabsTrigger>
          <TabsTrigger
            value="theme"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
          >
            업종/테마
          </TabsTrigger>
        </TabsList>

        {/* 종목정보 탭 */}
        <TabsContent value="chart" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Charts and Technicals (Span 8) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Chart Controls - Cleaner look */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex gap-1">
                  {(["D", "W", "M", "Y"] as const).map((p) => (
                    <Button
                      key={p}
                      variant={chartPeriod === p ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handlePeriodChange(p)}
                      className={`h-8 px-3 text-xs font-medium ${chartPeriod === p ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {p === "D" ? "일" : p === "W" ? "주" : p === "M" ? "월" : "년"}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-1 border-l pl-4 border-border/40">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={handleZoomIn}
                    title="확대"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={handleZoomOut}
                    title="축소"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Main Chart */}
              <Card className="p-0 border-border/40 shadow-sm overflow-hidden">
                <div className="p-1">
                  <CandlestickChart period={chartPeriod} itemCount={rangeCount} data={priceData} />
                </div>
              </Card>

              {/* Technical Indicators Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-2 border-border/40 shadow-sm">
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2">
                    <div className="w-1 h-3 bg-primary rounded-full"></div>
                    MACD
                  </h4>
                  <MACDChart period={chartPeriod} itemCount={rangeCount} />
                </Card>
                <Card className="p-2 border-border/40 shadow-sm">
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2">
                    <div className="w-1 h-3 bg-primary rounded-full"></div>
                    RSI
                  </h4>
                  <RSIChart period={chartPeriod} itemCount={rangeCount} />
                </Card>
              </div>
            </div>

            {/* Right Column: Company Info (Span 4) */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="h-full border-border/40 shadow-sm flex flex-col py-0 gap-0">
                <div className="px-4 py-2 border-b border-border/40 bg-muted/10 flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    기업 개요
                  </h3>
                  <p className="text-xs text-muted-foreground">주요 기업 정보 및 요약</p>
                </div>

                <div className="p-3 flex-1 space-y-2">
                  {loading ? (
                    <div className="flex items-center justify-center h-40 text-muted-foreground animate-pulse">
                      데이터 로딩 중...
                    </div>
                  ) : companyInfo ? (
                    <>
                      {/* Primary Info Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground font-medium">대표이사</span>
                          <p className="text-sm font-medium">{companyInfo.ceoName}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground font-medium">설립일</span>
                          <p className="text-sm font-medium">{companyInfo.founded}</p>
                        </div>
                      </div>

                      {/* Location & Web */}
                      <div className="space-y-2 pt-0">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground font-medium">본사</span>
                          <p className="text-sm font-medium leading-relaxed break-keep">{companyInfo.headquarters}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground font-medium">웹사이트</span>
                          <p className="text-sm font-medium truncate">
                            <a href={companyInfo.website?.startsWith('http') ? companyInfo.website : `http://${companyInfo.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline transition-colors">
                              {companyInfo.website || '-'}
                            </a>
                          </p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-border/50 my-2"></div>

                      {/* Detailed Info Section */}
                      {companyDetailInfo && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">상세 정보</h4>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {companyDetailInfo.한글명}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-y-1">
                            {Object.entries(companyDetailInfo)
                              .filter(([key]) => !['한글명', '업종'].includes(key))
                              .map(([key, value]) => (
                                <div key={key} className="flex items-start justify-between text-sm group py-0.5">
                                  <span className="text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap min-w-[60px]">{key}</span>
                                  <span className="font-medium text-right break-keep flex-1 ml-4 leading-snug">{value as string}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                      데이터를 불러올 수 없습니다
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 거래량 탭 */}
        <TabsContent value="volume" className="space-y-4 mt-4">
          {/* Controls Container for Volume Tab - Styled to match Stock Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-muted/20 rounded-lg border border-border/40">
            <div className="flex gap-1">
              {(["D", "W", "M", "Y"] as const).map((p) => (
                <Button
                  key={p}
                  variant={chartPeriod === p ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handlePeriodChange(p)}
                  className={`h-8 px-3 text-xs font-medium ${chartPeriod === p ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {p === "D" ? "일" : p === "W" ? "주" : p === "M" ? "월" : "년"}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-1 border-l pl-4 border-border/40">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleZoomIn}
                title="확대"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleZoomOut}
                title="축소"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card className="p-3">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold">거래량 추이</div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <div>평균거래량(5일): <span className="text-foreground font-medium">5.2M</span></div>
                <div>전일대비: <span className="text-red-500 font-medium">+15.4%</span></div>
              </div>
            </div>
            <VolumeChart period={chartPeriod} itemCount={rangeCount} data={priceData} />
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">금일 거래량</div>
              <div className="text-xl font-bold">15,420,230</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">거래대금</div>
              <div className="text-xl font-bold">1.2조</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">매수 체결강도</div>
              <div className="text-xl font-bold text-red-500">125.00%</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">외국인 소진율</div>
              <div className="text-xl font-bold">54.20%</div>
            </Card>
          </div>

          {/* Investor Trading Data Grid */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">투자자별 순매수 거래량 (최근 20일)</h3>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3 text-xs font-medium sticky left-0 bg-muted/50 z-20 whitespace-nowrap">일자</th>
                    <th className="text-right py-2 px-3 text-xs font-medium whitespace-nowrap">개인</th>
                    <th className="text-right py-2 px-3 text-xs font-medium whitespace-nowrap">외국인</th>
                    <th className="text-right py-2 px-3 text-xs font-medium">기관합계</th>
                    <th className="text-right py-2 px-3 text-xs font-medium">연기금</th>
                    <th className="text-right py-2 px-3 text-xs font-medium">기타외국인</th>
                    <th className="text-right py-2 px-3 text-xs font-medium">기타법인</th>
                    <th className="text-right py-2 px-3 text-xs font-medium">투신</th>
                    <th className="text-right py-2 px-3 text-xs font-medium">금융투자</th>
                    <th className="text-right py-2 px-3 text-xs font-medium">보험</th>
                    <th className="text-right py-2 px-3 text-xs font-medium">사모</th>
                    <th className="text-right py-2 px-3 text-xs font-medium">은행</th>
                    <th className="text-right py-2 px-3 text-xs font-medium">기타금융</th>
                  </tr>
                </thead>
                <tbody>
                  {investorTradingData.length > 0 ? (
                    investorTradingData.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-3 font-medium sticky left-0 bg-background z-10 whitespace-nowrap">{row.일자}</td>
                        <td className={`py-2 px-3 text-right ${row.개인 > 0 ? 'text-red-500' : row.개인 < 0 ? 'text-blue-500' : ''}`}>
                          {row.개인?.toLocaleString() || 0}
                        </td>
                        <td className={`py-2 px-3 text-right ${row.외국인 > 0 ? 'text-red-500' : row.외국인 < 0 ? 'text-blue-500' : ''}`}>
                          {row.외국인?.toLocaleString() || 0}
                        </td>
                        <td className={`py-2 px-3 text-right ${row.기관합계 > 0 ? 'text-red-500' : row.기관합계 < 0 ? 'text-blue-500' : ''}`}>
                          {row.기관합계?.toLocaleString() || 0}
                        </td>
                        <td className={`py-2 px-3 text-right ${row.연기금 > 0 ? 'text-red-500' : row.연기금 < 0 ? 'text-blue-500' : ''}`}>
                          {row.연기금?.toLocaleString() || 0}
                        </td>
                        <td className={`py-2 px-3 text-right ${row.기타외국인 > 0 ? 'text-red-500' : row.기타외국인 < 0 ? 'text-blue-500' : ''}`}>
                          {row.기타외국인?.toLocaleString() || 0}
                        </td>
                        <td className={`py-2 px-3 text-right ${row.기타법인 > 0 ? 'text-red-500' : row.기타법인 < 0 ? 'text-blue-500' : ''}`}>
                          {row.기타법인?.toLocaleString() || 0}
                        </td>
                        <td className={`py-2 px-3 text-right ${row.투신 > 0 ? 'text-red-500' : row.투신 < 0 ? 'text-blue-500' : ''}`}>
                          {row.투신?.toLocaleString() || 0}
                        </td>
                        <td className={`py-2 px-3 text-right ${row.금융투자 > 0 ? 'text-red-500' : row.금융투자 < 0 ? 'text-blue-500' : ''}`}>
                          {row.금융투자?.toLocaleString() || 0}
                        </td>
                        <td className={`py-2 px-3 text-right ${row.보험 > 0 ? 'text-red-500' : row.보험 < 0 ? 'text-blue-500' : ''}`}>
                          {row.보험?.toLocaleString() || 0}
                        </td>
                        <td className={`py-2 px-3 text-right ${row.사모 > 0 ? 'text-red-500' : row.사모 < 0 ? 'text-blue-500' : ''}`}>
                          {row.사모?.toLocaleString() || 0}
                        </td>
                        <td className={`py-2 px-3 text-right ${row.은행 > 0 ? 'text-red-500' : row.은행 < 0 ? 'text-blue-500' : ''}`}>
                          {row.은행?.toLocaleString() || 0}
                        </td>
                        <td className={`py-2 px-3 text-right ${row.기타금융 > 0 ? 'text-red-500' : row.기타금융 < 0 ? 'text-blue-500' : ''}`}>
                          {row.기타금융?.toLocaleString() || 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={13} className="py-8 text-center text-muted-foreground">
                        투자자별 거래 데이터를 불러오는 중...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 재무정보 탭 */}
        <TabsContent value="financial" className="space-y-4 mt-4">
          {/* 년도 선택 */}
          {financialYears.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">회계년도:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 text-sm border rounded-md bg-background"
              >
                {financialYears.map((year) => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </div>
          )}




          {/* 재무 지표 */}
          {financialSummary && financialSummary.length > 0 && (() => {
            const yearData = financialSummary.find((d: any) => d.year === selectedYear)
            if (!yearData) return null

            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">매출액</div>
                  <div className="text-lg font-bold">{yearData.매출액}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">영업이익</div>
                  <div className="text-lg font-bold">{yearData.영업이익}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">당기순이익</div>
                  <div className="text-lg font-bold">{yearData.당기순이익}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">영업이익률</div>
                  <div className="text-lg font-bold">{yearData.영업이익률}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">순이익률</div>
                  <div className="text-lg font-bold">{yearData.순이익률}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">ROE</div>
                  <div className="text-lg font-bold">{yearData.ROE}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">EPS</div>
                  <div className="text-lg font-bold">{yearData.EPS}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">PER</div>
                  <div className="text-lg font-bold">{yearData.PER}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">BPS</div>
                  <div className="text-lg font-bold">{yearData.BPS}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">PBR</div>
                  <div className="text-lg font-bold">{yearData.PBR}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">주당배당금</div>
                  <div className="text-lg font-bold">{yearData.주당배당금}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground">배당수익률</div>
                  <div className="text-lg font-bold">{yearData.배당수익률}</div>
                </Card>
              </div>
            )
          })()}



          {/* 재무 차트 (Added) */}
          {financialData && (
            <FinancialBarChart data={financialData} />
          )}


          {/* Quarterly Data Table Removed as per user request */}
        </TabsContent>

        {/* 네트워크 탭 */}
        <TabsContent value="network" className="space-y-4 mt-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">
              기업 관계도
              {networkData.groupName && <span className="text-muted-foreground ml-2">({networkData.groupName} 그룹)</span>}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              그룹 내 지분 관계를 시각화합니다. 노드 크기는 매출액, 연결선의 굵기는 지분율을 나타냅니다.
              선택된 기업은 주황색 테두리로 표시됩니다.
            </p>
            {networkData.nodes.length > 0 ? (
              <NetworkGraphForce
                data={networkData}
                height={600}
                targetNodeId={symbol}
              />
            ) : (
              <div className="flex h-[600px] items-center justify-center bg-muted/10 rounded-lg border border-dashed">
                <p className="text-muted-foreground">관계 데이터가 없거나 로딩 중입니다.</p>
              </div>
            )}
          </Card>
        </TabsContent>
        {/* 업종/테마 탭 */}
        <TabsContent value="theme" className="space-y-4 mt-4">
          <StockIndustryThemeTab symbol={symbol} />
        </TabsContent>
      </Tabs>
    </div >
  )
}
