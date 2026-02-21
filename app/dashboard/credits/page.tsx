"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, Check, Clock } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const creditPackages = [
  {
    id: "package-10",
    credits: 10,
    price: 9900,
    bonus: 0,
    popular: false,
  },
  {
    id: "package-50",
    credits: 50,
    price: 45000,
    bonus: 5,
    popular: true,
  },
  {
    id: "package-100",
    credits: 100,
    price: 85000,
    bonus: 15,
    popular: false,
  },
  {
    id: "package-500",
    credits: 500,
    price: 390000,
    bonus: 100,
    popular: false,
  },
]

// Mock transaction history
const transactions = [
  {
    id: 1,
    type: "사용",
    description: "모멘텀 전략 분석",
    credits: -3,
    date: "2025-01-20 14:30",
  },
  {
    id: 2,
    type: "충전",
    description: "50 크레딧 패키지 구매",
    credits: +55,
    date: "2025-01-19 10:15",
  },
  {
    id: 3,
    type: "사용",
    description: "업종 분석",
    credits: -2,
    date: "2025-01-18 16:45",
  },
  {
    id: 4,
    type: "지급",
    description: "회원가입 보너스",
    credits: +10,
    date: "2025-01-15 09:00",
  },
]

export default function CreditsPage() {
  const [currentCredits] = useState(10)

  const handlePurchase = (packageId: string) => {
    // TODO: Implement Toss Payments integration
    alert("결제 기능은 곧 추가될 예정입니다.")
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">크레딧 관리</h1>
        <p className="text-muted-foreground">크레딧을 충전하고 사용 내역을 확인하세요</p>
      </div>

      {/* Current balance */}
      <Card className="mb-8 bg-gradient-to-br from-primary/20 to-accent/20 p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="h-4 w-4" />
              <span>보유 크레딧</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-primary">{currentCredits}</span>
              <span className="text-xl text-muted-foreground">credits</span>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-2 text-sm text-muted-foreground">크레딧 사용 안내</div>
            <ul className="space-y-1 text-sm">
              <li>업종 분석: 2 크레딧</li>
              <li>투자 전략: 3 크레딧</li>
              <li>기술적 분석: 4 크레딧</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Credit packages */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">크레딧 충전</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {creditPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative p-6 ${pkg.popular ? "border-primary bg-card shadow-lg shadow-primary/20" : ""}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    인기
                  </span>
                </div>
              )}

              <div className="mb-4 text-center">
                <div className="mb-2 text-4xl font-bold text-primary">{pkg.credits}</div>
                <div className="text-sm text-muted-foreground">크레딧</div>
                {pkg.bonus > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-500">
                    <Check className="h-3 w-3" />
                    보너스 +{pkg.bonus}
                  </div>
                )}
              </div>

              <div className="mb-4 text-center">
                <div className="text-2xl font-bold">₩{pkg.price.toLocaleString()}</div>
              </div>

              <Button
                className="w-full"
                variant={pkg.popular ? "default" : "outline"}
                onClick={() => handlePurchase(pkg.id)}
              >
                구매하기
              </Button>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">결제는 토스페이먼츠를 통해 안전하게 처리됩니다</p>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">사용 내역</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>날짜</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>설명</TableHead>
                <TableHead className="text-right">크레딧</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {transaction.date}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        transaction.type === "충전"
                          ? "bg-green-500/10 text-green-500"
                          : transaction.type === "지급"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-medium ${transaction.credits > 0 ? "text-green-500" : "text-muted-foreground"}`}
                    >
                      {transaction.credits > 0 ? "+" : ""}
                      {transaction.credits}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
