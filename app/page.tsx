"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase/client"

export default function IndexPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")

    if (!email || !password) {
      // 아이디/비밀번호 없이 클릭 시 비회원으로 진입
      setIsLoading(false)
      router.push("/dashboard")
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setIsLoading(false)

    if (error) {
      setErrorMsg("이메일 또는 비밀번호가 올바르지 않습니다.")
    } else {
      router.push("/dashboard")
    }
  }

  const handleSocialLogin = () => {
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">F</span>
          </div>
          <h1 className="text-3xl font-bold">FINEX</h1>
          <p className="mt-1 text-sm text-muted-foreground">스마트한 투자의 시작</p>
        </div>

        <Card className="border-border/50 bg-card/80 p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {errorMsg && (
              <p className="text-xs text-red-500">{errorMsg}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "입장 중..." : "로그인 / 비회원 입장"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">또는</span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-2">
            <Button variant="outline" className="w-full gap-2 text-sm" onClick={handleSocialLogin}>
              <span className="text-yellow-500 font-bold">K</span> 카카오로 시작하기
            </Button>
            <Button variant="outline" className="w-full gap-2 text-sm" onClick={handleSocialLogin}>
              <span className="text-green-600 font-bold">N</span> 네이버로 시작하기
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
