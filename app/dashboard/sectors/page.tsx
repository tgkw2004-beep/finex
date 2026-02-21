"use client"

import { useState, useEffect, useRef } from "react"
import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface SectorData {
  name: string
  change: string
  changeRaw: number
  stocks: number
}

interface SectorDetail {
  "일자": string
  "종목명": string
  "종목코드": string
  "최근 시총(원)": string
  "1개월 시총 상승률": number
  "3개월 등락률": number
  "세부정보": string
}

export default function SectorsPage() {
  const router = useRouter()
  const initialized = useRef(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [sectors, setSectors] = useState<SectorData[]>([])
  const [loadingSectors, setLoadingSectors] = useState(false)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const [selectedSector, setSelectedSector] = useState<string | null>(null)
  const [sectorDetails, setSectorDetails] = useState<SectorDetail[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  const [pageDetails, setPageDetails] = useState(1)
  const itemsPerPageDetails = 10

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      handleAnalyze()
    }
  }, [])

  const handleAnalyze = async () => {
    setAnalyzed(true)
    setLoadingSectors(true)
    try {
      const res = await fetch('/api/sectors')
      const data = await res.json()
      if (Array.isArray(data)) {
        setSectors(data)
        if (data.length > 0) {
          handleSelectSector(data[0].name)
        }
      } else {
        setSectors([])
        console.error("API did not return an array:", data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingSectors(false)
    }
  }

  const handleSelectSector = async (name: string) => {
    setSelectedSector(name)
    setLoadingDetails(true)
    setPageDetails(1) // Reset detail pagination when sector changes
    try {
      const res = await fetch(`/api/sectors/${encodeURIComponent(name)}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setSectorDetails(data)
      } else {
        setSectorDetails([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingDetails(false)
    }
  }

  const totalPages = Math.ceil(sectors.length / itemsPerPage)
  const currentSectors = sectors.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1))
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1))

  const totalPagesDetails = Math.ceil(sectorDetails.length / itemsPerPageDetails)
  const currentDetails = sectorDetails.slice((pageDetails - 1) * itemsPerPageDetails, pageDetails * itemsPerPageDetails)

  const handlePrevPageDetails = () => setPageDetails((p) => Math.max(1, p - 1))
  const handleNextPageDetails = () => setPageDetails((p) => Math.min(totalPagesDetails, p + 1))

  return (
    <div className="flex flex-col h-full gap-2 pb-2">
      <AnalysisHeader
        title="업종 분석"
        description="업종별 시장 동향과 주요 종목을 1개월/3개월 기준으로 상세 분석합니다."
      />

      {analyzed ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-3">
          {/* Left Pane: Sector List */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-semibold">업종별 현황</h2>

            {loadingSectors ? (
              <div className="flex flex-col gap-1.5 animate-pulse">
                {[...Array(10)].map((_, i) => (
                  <Card key={i} className="h-12 bg-muted shrink-0" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {currentSectors.map((sector) => {
                  const isPositive = sector.changeRaw > 0
                  const isSelected = selectedSector === sector.name

                  return (
                    <Card
                      key={sector.name}
                      className={`py-1 px-2 cursor-pointer transition-colors hover:border-primary/50 relative overflow-hidden shrink-0 min-h-[44px] flex flex-col justify-center ${isSelected ? 'border-primary ring-1 ring-primary' : ''}`}
                      onClick={() => handleSelectSector(sector.name)}
                    >
                      {/* Background Bar Chart */}
                      <div
                        className={`absolute top-0 bottom-0 left-0 opacity-10 transition-all ${isPositive ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(Math.abs(sector.changeRaw), 100)}%` }}
                      />

                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{sector.name}</p>
                          <p className="text-[11px] text-muted-foreground">{sector.stocks}개 종목</p>
                        </div>
                        <div className={`text-base font-bold ${isPositive ? 'text-red-500' : sector.changeRaw < 0 ? 'text-blue-500' : 'text-gray-500'}`}>
                          {sector.change}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {!loadingSectors && totalPages > 1 && (
              <div className="flex items-center justify-between mt-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handlePrevPage} disabled={page === 1}>
                  <ChevronLeft className="h-3 w-3 mr-1" /> 이전
                </Button>
                <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleNextPage} disabled={page === totalPages}>
                  다음 <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}

          </div>

          {/* Right Pane: Sector Details */}
          <div className="flex flex-col gap-1.5 h-full">
            <h2 className="text-base font-semibold">
              {selectedSector ? `[${selectedSector}] 상세 종목` : '업종별 주요 종목'}
            </h2>

            {loadingDetails || loadingSectors ? (
              <Card className="p-12 text-center animate-pulse flex flex-col items-center justify-center flex-1">
                <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                <p className="text-muted-foreground">
                  {loadingSectors ? '전체 업종 데이터를 분석 중입니다...' : '상세 종목 데이터를 불러오는 중입니다...'}
                </p>
              </Card>
            ) : selectedSector ? (
              <Card className="p-0 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full h-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 font-medium">일자</th>
                        <th className="px-4 py-3 font-medium">종목명</th>
                        <th className="px-4 py-3 font-medium text-right">최근 시총(원)</th>
                        <th className="px-4 py-3 font-medium text-right">1개월 시총 상승률</th>
                        <th className="px-4 py-3 font-medium text-right">3개월 등락률</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {currentDetails.length > 0 ? currentDetails.map((item, idx) => {
                        const capRate = Number(item['1개월 시총 상승률'] || 0)
                        const priceRate = Number(item['3개월 등락률'] || 0)
                        return (
                          <tr
                            key={idx}
                            className="hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/dashboard/stock/${item['종목코드']}`)}
                          >
                            <td className="px-3 py-1 text-muted-foreground">{item['일자']}</td>
                            <td className="px-3 py-1 font-medium">{item['종목명']}</td>
                            <td className="px-3 py-1 text-right tabular-nums">{item['최근 시총(원)']}</td>
                            <td className={`px-3 py-1 text-right font-medium tabular-nums ${capRate > 0 ? 'text-red-500' : capRate < 0 ? 'text-blue-500' : ''}`}>
                              {capRate > 0 ? '+' : ''}{capRate}%
                            </td>
                            <td className={`px-3 py-1 text-right font-medium tabular-nums ${priceRate > 0 ? 'text-red-500' : priceRate < 0 ? 'text-blue-500' : ''}`}>
                              {priceRate !== null ? `${priceRate > 0 ? '+' : ''}${priceRate}%` : '-'}
                            </td>
                          </tr>
                        )
                      }) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                            해당 기간에 비교 가능한 데이터가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center min-h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">왼쪽에서 업종을 선택해주세요.</p>
              </Card>
            )}

            {/* Right Pane Pagination */}
            {!loadingDetails && selectedSector && totalPagesDetails > 1 && (
              <div className="flex items-center justify-between mt-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handlePrevPageDetails} disabled={pageDetails === 1}>
                  <ChevronLeft className="h-3 w-3 mr-1" /> 이전
                </Button>
                <span className="text-xs text-muted-foreground">{pageDetails} / {totalPagesDetails}</span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleNextPageDetails} disabled={pageDetails === totalPagesDetails}>
                  다음 <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}

          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">분석 실행 버튼을 클릭하여 업종 분석을 시작하세요</p>
        </Card>
      )}
    </div>
  )
}
