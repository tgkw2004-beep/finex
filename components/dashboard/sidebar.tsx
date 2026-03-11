"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  Target,
  Zap,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Coins,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { StockSearch } from "@/components/dashboard/stock-search"

const navigation = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { name: "업종 분석", href: "/dashboard/sectors", icon: PieChart },
  { name: "모멘텀 전략", href: "/dashboard/momentum", icon: TrendingUp },
  { name: "가치 투자", href: "/dashboard/value", icon: DollarSign },
  { name: "성장주 분석", href: "/dashboard/growth", icon: Zap },
  { name: "배당주 분석", href: "/dashboard/dividend", icon: Coins },
  { name: "기술적 분석", href: "/dashboard/technical", icon: BarChart3 },
]

// ... existing imports

export function DashboardSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border/40 bg-card">
      {/* ... header ... */}
      <div className="flex h-16 items-center justify-between gap-2 border-b border-border/40 px-6">
        <div className="flex items-center gap-2">
          {/* ... logo ... */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">F</span>
          </div>
          <span className="text-xl font-bold">FINEX</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden" aria-label="Close menu">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
        {/* 종목 검색 */}
        <div className="mt-4 mb-2 px-1">
          <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">종목 검색</div>
          <StockSearch />
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="space-y-1 border-t border-border/40 p-4">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="h-5 w-5" />
          설정
        </Link>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={() => {
            // Logout logic here
          }}
        >
          <LogOut className="h-5 w-5" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
