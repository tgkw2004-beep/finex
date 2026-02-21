import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp, BarChart3, Zap } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/40">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

      <div className="container relative">
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 text-center sm:py-20">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Zap className="h-4 w-4" />
            <span>AI 기반 실시간 분석</span>
          </div>

          {/* Main heading */}
          <h1 className="mb-6 max-w-4xl text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
            데이터로 시작하는
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">스마트한 투자</span>
          </h1>

          {/* Description */}
          <p className="mb-10 max-w-2xl px-4 text-pretty text-base text-muted-foreground sm:text-lg lg:text-xl">
            FINEX는 실시간 시장 데이터와 AI 분석을 통해 개인 투자자에게 전문가 수준의 인사이트를 제공합니다
          </p>

          {/* CTA buttons */}
          <div className="flex w-full max-w-sm flex-col gap-3 px-4 sm:max-w-none sm:flex-row sm:justify-center sm:px-0">
            <Button size="lg" className="w-full gap-2 sm:w-auto" asChild>
              <Link href="/signup">
                무료로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent" asChild>
              <Link href="/dashboard">데모 보기</Link>
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="mt-12 grid w-full max-w-4xl gap-6 px-4 sm:mt-20 sm:grid-cols-3 sm:gap-8">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border/40 bg-card/50 p-6 backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">실시간 시장 분석</h3>
              <p className="text-center text-sm text-muted-foreground">주요 지수와 업종별 트렌드를 실시간으로 확인</p>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-lg border border-border/40 bg-card/50 p-6 backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold">AI 투자 전략</h3>
              <p className="text-center text-sm text-muted-foreground">데이터 기반 투자 전략과 종목 추천</p>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-lg border border-border/40 bg-card/50 p-6 backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">간편한 사용</h3>
              <p className="text-center text-sm text-muted-foreground">복잡한 데이터를 직관적인 UI로 제공</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
