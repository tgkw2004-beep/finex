"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">F</span>
          </div>
          <span className="text-xl font-bold">FINEX</span>
        </Link>

        <div className="hidden items-center gap-3 sm:flex">
          <Button variant="outline" className="bg-transparent" asChild>
            <Link href="/">홈으로</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login">로그인</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">회원가입</Link>
          </Button>
        </div>

        <button className="sm:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur sm:hidden">
          <div className="container flex flex-col gap-2 py-4">
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                홈으로
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                로그인
              </Link>
            </Button>
            <Button className="w-full" asChild>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                회원가입
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
