"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface SectorData {
  name: string
  change: string
  stocks: number
}

export function HotSectors() {
  const [sectors, setSectors] = useState<SectorData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/hot-sectors')
        if (!res.ok) throw new Error('Failed to fetch hot sectors')
        const data = await res.json()
        setSectors(data)
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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">업종분석 (상위 5개)</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/sectors">전체 보기</Link>
          </Button>
        </div>
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
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">업종분석 (상위 5개)</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/sectors">전체 보기</Link>
        </Button>
      </div>

      <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {sectors.map((sector) => (
          <Link key={sector.name} href={`/dashboard/sectors?name=${encodeURIComponent(sector.name)}`}>
            <Card className="px-2 py-1 transition-colors hover:bg-accent/50 cursor-pointer hover:border-primary/50">
              <div className="flex items-center justify-between gap-1">
                <span className="font-semibold text-sm truncate" title={sector.name}>{sector.name}</span>
                <div className="flex items-center gap-0.5 text-green-500 shrink-0">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs font-medium">{sector.change}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{sector.stocks}개 종목</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
