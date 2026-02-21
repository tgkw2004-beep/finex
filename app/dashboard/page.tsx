import { MarketIndices } from "@/components/dashboard/market-indices"
import { ExchangeRates } from "@/components/dashboard/exchange-rates"
import { HotSectors } from "@/components/dashboard/hot-sectors"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">대시보드</h1>
        <p className="text-sm text-muted-foreground sm:text-base">실시간 시장 데이터와 주요 지수를 확인하세요</p>
      </div>

      <MarketIndices />
      <HotSectors />
      <ExchangeRates />
    </div>
  )
}
