"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, TrendingUp, TrendingDown, Trash2, Search, Pencil } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Holding {
  id: string
  stock_code: string
  stock_name: string
  shares: number
  buy_price: number
  buy_date: string
  current_price: number
  eval_amount: number
  profit: number
  profit_pct: number
  holding_days: number
}

interface SearchResult {
  stock_code: string
  stock_name: string
}

// ─── Add Stock Modal ──────────────────────────────────────────────────────────
function AddStockModal({ token, onAdded }: { token: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [shares, setShares] = useState("1")
  const [buyPrice, setBuyPrice] = useState("")
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split("T")[0])
  const [saving, setSaving] = useState(false)

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (q.length < 1) { setResults([]); return }
    const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}`)
    if (res.ok) {
      const data = await res.json()
      setResults(data.results || [])
    }
  }

  const handleSelect = (r: SearchResult) => {
    setSelected(r)
    setQuery(r.stock_name)
    setResults([])
  }

  const handleSave = async () => {
    if (!selected || !buyPrice || !buyDate) return
    setSaving(true)
    await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        stock_code: selected.stock_code,
        stock_name: selected.stock_name,
        shares: Number(shares),
        buy_price: Number(buyPrice),
        buy_date: buyDate,
      }),
    })
    setSaving(false)
    setOpen(false)
    setSelected(null); setQuery(""); setBuyPrice(""); setShares("1")
    onAdded()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" />종목 추가</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>종목 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* 종목 검색 */}
          <div className="space-y-1.5">
            <Label className="text-xs">종목 검색</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="종목명 또는 코드 입력"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            {results.length > 0 && (
              <div className="border rounded-md bg-background shadow-md max-h-48 overflow-y-auto">
                {results.map((r) => (
                  <div
                    key={r.stock_code}
                    className="px-3 py-2 hover:bg-muted cursor-pointer text-sm flex justify-between"
                    onClick={() => handleSelect(r)}
                  >
                    <span className="font-medium">{r.stock_name}</span>
                    <span className="text-muted-foreground">{r.stock_code}</span>
                  </div>
                ))}
              </div>
            )}
            {selected && (
              <p className="text-xs text-green-600">선택됨: {selected.stock_name} ({selected.stock_code})</p>
            )}
          </div>

          {/* 매수 수량 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">매수 수량 (주)</Label>
              <Input type="number" min="1" value={shares} onChange={(e) => setShares(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">매수 가격 (원)</Label>
              <Input type="number" placeholder="70000" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
            </div>
          </div>

          {/* 매수 일자 */}
          <div className="space-y-1.5">
            <Label className="text-xs">매수 일자</Label>
            <Input type="date" value={buyDate} onChange={(e) => setBuyDate(e.target.value)} max={new Date().toISOString().split("T")[0]} />
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!selected || !buyPrice || !buyDate || saving}
          >
            {saving ? "저장 중..." : "추가하기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Stock Modal ────────────────────────────────────────────────────────
function EditStockModal({ token, holding, onUpdated }: { token: string; holding: Holding; onUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [shares, setShares] = useState(String(holding.shares))
  const [buyPrice, setBuyPrice] = useState(String(holding.buy_price))
  const [buyDate, setBuyDate] = useState(holding.buy_date)
  const [saving, setSaving] = useState(false)

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShares(String(holding.shares))
    setBuyPrice(String(holding.buy_price))
    setBuyDate(holding.buy_date)
    setOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch("/api/portfolio", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: holding.id, shares: Number(shares), buy_price: Number(buyPrice), buy_date: buyDate }),
    })
    setSaving(false)
    setOpen(false)
    onUpdated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={handleOpen}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{holding.stock_name} 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">매수 수량 (주)</Label>
              <Input type="number" min="1" value={shares} onChange={(e) => setShares(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">매수 가격 (원)</Label>
              <Input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">매수 일자</Label>
            <Input type="date" value={buyDate} onChange={(e) => setBuyDate(e.target.value)} max={new Date().toISOString().split("T")[0]} />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={!shares || !buyPrice || !buyDate || saving}>
            {saving ? "저장 중..." : "수정 저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function PortfolioPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)

  // 세션 확인
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/"); return }
      setToken(session.access_token)
    })
  }, [router])

  const fetchHoldings = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const res = await fetch("/api/portfolio", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setHoldings(data.holdings || [])
    }
    setLoading(false)
  }, [token])

  useEffect(() => { fetchHoldings() }, [fetchHoldings])

  const handleDelete = async (id: string) => {
    if (!token || !confirm("삭제하시겠습니까?")) return
    await fetch("/api/portfolio", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    })
    fetchHoldings()
  }

  // 집계
  const totalEval = holdings.reduce((s, h) => s + h.eval_amount, 0)
  const totalCost = holdings.reduce((s, h) => s + h.buy_price * h.shares, 0)
  const totalProfit = totalEval - totalCost
  const totalProfitPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
  const isProfitable = totalProfit >= 0

  if (!token) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">포트폴리오</h1>
          <p className="text-muted-foreground text-sm">보유 종목과 수익률을 관리합니다</p>
        </div>
        <AddStockModal token={token} onAdded={fetchHoldings} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <div className="mb-2 text-sm text-muted-foreground">총 평가액</div>
          <div className="text-3xl font-bold">₩{totalEval.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">원가 ₩{totalCost.toLocaleString()}</div>
        </Card>
        <Card className="p-6">
          <div className="mb-2 text-sm text-muted-foreground">총 수익</div>
          <div className={`text-3xl font-bold ${isProfitable ? "text-red-500" : "text-blue-500"}`}>
            {isProfitable ? "+" : ""}₩{totalProfit.toLocaleString()}
          </div>
          <div className={`text-sm mt-1 ${isProfitable ? "text-red-500" : "text-blue-500"}`}>
            {isProfitable ? "+" : ""}{totalProfitPct.toFixed(2)}%
          </div>
        </Card>
        <Card className="p-6">
          <div className="mb-2 text-sm text-muted-foreground">보유 종목</div>
          <div className="text-3xl font-bold">{holdings.length}<span className="text-base font-normal text-muted-foreground ml-1">종목</span></div>
        </Card>
      </div>

      {/* Holdings List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">보유 종목</h2>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
        ) : holdings.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <p>보유 종목이 없습니다</p>
            <p className="text-sm mt-1">종목 추가 버튼으로 첫 번째 종목을 추가해보세요</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {holdings.map((h) => {
              const isPos = h.profit >= 0
              return (
                <Card key={h.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/dashboard/stock/${h.stock_code}`)}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{h.stock_name}</span>
                        <span className="text-xs text-muted-foreground">{h.stock_code}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                          {h.holding_days}일 보유
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-sm">
                        <span><span className="text-muted-foreground">보유 </span><span className="font-medium">{h.shares.toLocaleString()}주</span></span>
                        <span><span className="text-muted-foreground">매수가 </span><span className="font-medium">₩{Number(h.buy_price).toLocaleString()}</span></span>
                        <span><span className="text-muted-foreground">현재가 </span><span className="font-medium">₩{h.current_price.toLocaleString()}</span></span>
                        <span><span className="text-muted-foreground">평가액 </span><span className="font-medium">₩{h.eval_amount.toLocaleString()}</span></span>
                        <span><span className="text-muted-foreground">매수일 </span><span className="font-medium">{h.buy_date}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className={`flex items-center gap-1 font-semibold ${isPos ? "text-red-500" : "text-blue-500"}`}>
                          {isPos ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {isPos ? "+" : ""}₩{h.profit.toLocaleString()}
                        </div>
                        <div className={`text-sm ${isPos ? "text-red-500" : "text-blue-500"}`}>
                          {isPos ? "+" : ""}{h.profit_pct.toFixed(2)}%
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <EditStockModal token={token} holding={h} onUpdated={fetchHoldings} />
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={(e) => { e.stopPropagation(); handleDelete(h.id) }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
