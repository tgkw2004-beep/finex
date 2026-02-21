"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, TrendingDown } from "lucide-react"

// Mock data
const portfolio = [
  {
    name: "삼성전자",
    code: "005930",
    shares: 10,
    avgPrice: "70,000",
    currentPrice: "71,500",
    profit: "+15,000",
    profitPercent: "+2.14%",
    isPositive: true,
  },
  {
    name: "SK하이닉스",
    code: "000660",
    shares: 5,
    avgPrice: "140,000",
    currentPrice: "142,000",
    profit: "+10,000",
    profitPercent: "+1.43%",
    isPositive: true,
  },
  {
    name: "NAVER",
    code: "035420",
    shares: 3,
    avgPrice: "220,000",
    currentPrice: "215,000",
    profit: "-15,000",
    profitPercent: "-2.27%",
    isPositive: false,
  },
]

export default function PortfolioPage() {
  const totalValue = 2875000
  const totalProfit = 10000
  const totalProfitPercent = 0.35

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">포트폴리오</h1>
          <p className="text-muted-foreground">보유 종목과 수익률을 관리합니다</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          종목 추가
        </Button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <div className="mb-2 text-sm text-muted-foreground">총 평가액</div>
          <div className="text-3xl font-bold">₩{totalValue.toLocaleString()}</div>
        </Card>
        <Card className="p-6">
          <div className="mb-2 text-sm text-muted-foreground">총 수익</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-green-500">₩{totalProfit.toLocaleString()}</div>
            <div className="text-lg text-green-500">+{totalProfitPercent}%</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="mb-2 text-sm text-muted-foreground">보유 종목</div>
          <div className="text-3xl font-bold">{portfolio.length}</div>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">보유 종목</h2>
        <div className="space-y-3">
          {portfolio.map((stock) => (
            <Card key={stock.code} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <div>
                      <div className="font-semibold">{stock.name}</div>
                      <div className="text-sm text-muted-foreground">{stock.code}</div>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">보유: </span>
                      <span className="font-medium">{stock.shares}주</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">평균 매입가: </span>
                      <span className="font-medium">₩{stock.avgPrice}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">현재가: </span>
                      <span className="font-medium">₩{stock.currentPrice}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {stock.isPositive ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`font-semibold ${stock.isPositive ? "text-green-500" : "text-red-500"}`}>
                      {stock.profit}
                    </span>
                  </div>
                  <div className={`text-sm ${stock.isPositive ? "text-green-500" : "text-red-500"}`}>
                    {stock.profitPercent}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
