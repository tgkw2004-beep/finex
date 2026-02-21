"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MarketData {
  date: string
  closing_price?: number
  close?: number
}

interface IndexData {
  name: string
  value: string
  change: string
  changePercent: string
  isPositive: boolean
  isNeutral: boolean
}

export function MarketIndices() {
  const [indices, setIndices] = useState<IndexData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/market-indices')
        if (!res.ok) throw new Error('Failed to fetch market indices')
        const data = await res.json()

        const processIndex = (name: string, dataPoints: MarketData[]) => {
          if (!dataPoints || dataPoints.length < 2) return null

          const latest = dataPoints[dataPoints.length - 1]
          const previous = dataPoints[dataPoints.length - 2]

          const latestValue = latest.closing_price || latest.close || 0
          const previousValue = previous.closing_price || previous.close || 0

          const change = latestValue - previousValue
          const changePercent = (change / previousValue) * 100

          return {
            name,
            value: latestValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            change: (change > 0 ? "+" : "") + change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            changePercent: (change > 0 ? "+" : "") + changePercent.toFixed(2) + "%",
            isPositive: change > 0,
            isNeutral: change === 0
          }
        }

        const newIndices = [
          processIndex("KOSPI", data.kospi),
          processIndex("KOSDAQ", data.kosdaq),
          processIndex("S&P 500", data.spx),
          processIndex("NASDAQ", data.comp),
          processIndex("다우존스", data.dji),
        ].filter(Boolean) as IndexData[]

        setIndices(newIndices)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div>
        <h2 className="mb-2 text-xl font-semibold">주요 지수</h2>
        <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="px-2 py-1 h-[60px] animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">주요 지수</h2>
      <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {indices.map((index) => (
          <Card key={index.name} className="px-2 py-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{index.name}</span>
              <div className="flex items-center gap-0.5">
                {index.isNeutral ? (
                  <Minus className="h-3 w-3 text-muted-foreground" />
                ) : index.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs ${index.isNeutral ? "text-muted-foreground" : index.isPositive ? "text-green-500" : "text-red-500"}`}>
                  {index.changePercent}
                </span>
              </div>
            </div>
            <div className="text-lg font-bold leading-tight">{index.value}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
