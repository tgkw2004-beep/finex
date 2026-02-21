"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun } from "lucide-react"

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">설정</h1>
        <p className="text-muted-foreground">계정 정보와 알림 설정을 관리하세요</p>
      </div>

      <div className="space-y-6">
        {/* Theme settings */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">테마 설정</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">화면 모드</div>
                <div className="text-sm text-muted-foreground">
                  {theme === "dark" ? "다크 모드" : "라이트 모드"}가 활성화되어 있습니다
                </div>
              </div>
              <Button onClick={toggleTheme} variant="outline" size="icon">
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </Card>

        {/* Profile settings */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">프로필 정보</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" defaultValue="홍길동" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" defaultValue="user@example.com" disabled />
              <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다</p>
            </div>
            <Button>저장</Button>
          </div>
        </Card>

        {/* Password change */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">비밀번호 변경</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button>비밀번호 변경</Button>
          </div>
        </Card>

        {/* Subscription */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">구독 정보</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">현재 플랜</div>
                <div className="text-sm text-muted-foreground">무료 플랜</div>
              </div>
              <Button asChild>
                <a href="/#pricing">플랜 업그레이드</a>
              </Button>
            </div>
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-destructive">위험 구역</h2>
          <Separator className="mb-4" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">계정 삭제</div>
                <div className="text-sm text-muted-foreground">계정을 영구적으로 삭제합니다</div>
              </div>
              <Button variant="destructive">계정 삭제</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
