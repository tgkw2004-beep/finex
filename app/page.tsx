"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function IndexPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // 로그인 시뮬레이션 - 나중에 실제 인증 로직으로 대체
    setTimeout(() => {
      setIsLoading(false)
      router.push("/dashboard")
    }, 500)
  }

  const handleSocialLogin = (provider: string) => {
    // SNS 로그인 시뮬레이션 - 나중에 실제 OAuth 로직으로 대체
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Background gradient effect */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">F</span>
          </div>
          <h1 className="text-3xl font-bold">FINEX</h1>
          <p className="mt-1 text-sm text-muted-foreground">스마트한 투자의 시작</p>
        </div>

        <Card className="border-border/50 bg-card/80 p-6 backdrop-blur-sm">
          {/* ID/PW Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9"
                required
              />
            </div>

            <Button type="submit" className="h-9 w-full" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">또는</span>
            <Separator className="flex-1" />
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full gap-2 bg-[#FEE500] text-[#000000] hover:bg-[#FEE500]/90 border-[#FEE500]"
              onClick={() => handleSocialLogin("kakao")}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.745 1.855 5.157 4.653 6.498-.149.562-.964 3.623-.996 3.865 0 0-.02.165.087.228.107.063.232.014.232.014.306-.043 3.54-2.312 4.102-2.71.627.091 1.275.139 1.922.139 5.523 0 10-3.463 10-7.691S17.523 3 12 3z"/>
              </svg>
              카카오로 시작하기
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-9 w-full gap-2 bg-[#03C75A] text-white hover:bg-[#03C75A]/90 border-[#03C75A]"
              onClick={() => handleSocialLogin("naver")}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
              </svg>
              네이버로 시작하기
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-9 w-full gap-2 bg-transparent"
              onClick={() => handleSocialLogin("google")}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 시작하기
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Sign up link */}
          <div className="text-center">
            <span className="text-xs text-muted-foreground">아직 계정이 없으신가요? </span>
            <Link href="/signup" className="text-xs text-primary hover:underline">
              회원가입
            </Link>
          </div>
        </Card>

        {/* Landing page link */}
        <div className="mt-4 text-center">
          <Link href="/landing" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            서비스 소개 보기
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[10px] text-muted-foreground">
          로그인하면{" "}
          <Link href="/terms" className="underline hover:text-foreground">이용약관</Link>
          {" "}및{" "}
          <Link href="/privacy" className="underline hover:text-foreground">개인정보처리방침</Link>
          에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  )
}
