import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "무료",
    price: "0",
    description: "FINEX를 처음 시작하는 분들을 위한 플랜",
    features: ["가입 시 10 크레딧 제공", "기본 시장 데이터 조회", "주요 지수 대시보드", "제한된 분석 도구"],
    cta: "무료로 시작하기",
    highlighted: false,
  },
  {
    name: "베이직",
    price: "29,000",
    description: "개인 투자자를 위한 필수 기능",
    features: [
      "월 100 크레딧 제공",
      "모든 시장 데이터 무제한 조회",
      "AI 기반 업종 분석",
      "투자 전략 도구",
      "실시간 알림",
    ],
    cta: "베이직 시작하기",
    highlighted: true,
  },
  {
    name: "프로",
    price: "99,000",
    description: "전문 투자자를 위한 고급 기능",
    features: [
      "월 500 크레딧 제공",
      "모든 베이직 기능 포함",
      "고급 AI 분석 도구",
      "포트폴리오 최적화",
      "우선 고객 지원",
      "API 접근 권한",
    ],
    cta: "프로 시작하기",
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="border-b border-border/40 py-12 sm:py-24">
      <div className="container px-4">
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            투자 목표에 맞는 플랜을 선택하세요
          </h2>
          <p className="text-pretty text-base text-muted-foreground sm:text-lg">모든 플랜은 언제든지 변경 가능합니다</p>
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-lg border p-8 ${
                plan.highlighted ? "border-primary bg-card shadow-lg shadow-primary/20" : "border-border/40 bg-card/50"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                    인기
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₩{plan.price}</span>
                  {plan.price !== "0" && <span className="text-muted-foreground">/월</span>}
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} asChild>
                <Link href="/signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center sm:mt-12">
          <p className="text-sm text-muted-foreground">크레딧은 AI 분석 및 고급 기능 사용 시 차감됩니다</p>
        </div>
      </div>
    </section>
  )
}
