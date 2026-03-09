"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface ExchangeRateData {
    name: string
    value: number
    date: string
    todayAbs: number | null
    todayPct: number | null
    weekPct: number | null
    monthPct: number | null
    sixMonthPct: number | null
    yearPct: number | null
    fiveYearPct: number | null
}

interface ApiResponse {
    USD?: ExchangeRateData
    JPY?: ExchangeRateData
    EUR?: ExchangeRateData
    CNY?: ExchangeRateData
}

export function ExchangeRates() {
    const [rates, setRates] = useState<ExchangeRateData[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/exchange-rates')
                if (!res.ok) throw new Error('Failed to fetch exchange rates')
                const data: ApiResponse = await res.json()

                const newRates = [
                    data.USD,
                    data.JPY,
                    data.EUR,
                    data.CNY
                ].filter(Boolean) as ExchangeRateData[]

                setRates(newRates)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const getDisplayInfo = (dbName: string) => {
        switch (dbName) {
            case '원/미국달러(매매기준율)': return { symbol: 'USD/KRW', desc: '미국 달러 / 한국 원' }
            case '원/일본엔(100엔)': return { symbol: 'JPY/KRW', desc: '일본 엔 (100엔) / 한국 원' }
            case '원/유로': return { symbol: 'EUR/KRW', desc: '유로 / 한국 원' }
            case '원/위안(매매기준율)': return { symbol: 'CNY/KRW', desc: '중국 위안 / 한국 원' }
            default: return { symbol: dbName, desc: '' }
        }
    }

    const renderPercentCell = (pct: number | null) => {
        if (pct === null || pct === undefined) return <TableCell className="text-right text-muted-foreground font-medium pr-4">-</TableCell>
        const isPositive = pct > 0
        const isNeutral = pct === 0
        const colorClass = isNeutral ? "text-muted-foreground" : isPositive ? "text-red-500" : "text-blue-500"

        return (
            <TableCell className={`text-right font-medium pr-4 ${colorClass}`}>
                {(isPositive ? "+" : "")}{pct.toFixed(2)}%
            </TableCell>
        )
    }

    return (
        <div>
            <h2 className="mb-2 text-xl font-semibold">외환 및 통화</h2>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="min-w-[120px] font-semibold text-muted-foreground pl-6">심볼</TableHead>
                            <TableHead className="min-w-[180px] font-semibold text-muted-foreground hidden md:table-cell">종목명</TableHead>
                            <TableHead className="font-semibold text-muted-foreground text-right pr-4">현재가</TableHead>
                            <TableHead className="font-semibold text-muted-foreground text-right pr-4">오늘</TableHead>
                            <TableHead className="font-semibold text-muted-foreground text-right pr-4">1주</TableHead>
                            <TableHead className="font-semibold text-muted-foreground text-right pr-4">1개월</TableHead>
                            <TableHead className="font-semibold text-muted-foreground text-right pr-4">6개월</TableHead>
                            <TableHead className="font-semibold text-muted-foreground text-right pr-6">1년</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(4)].map((_, i) => (
                                <TableRow key={i} className="animate-pulse">
                                    <TableCell className="pl-6"><div className="h-4 w-16 bg-muted rounded"></div></TableCell>
                                    <TableCell className="hidden md:table-cell"><div className="h-4 w-32 bg-muted rounded"></div></TableCell>
                                    <TableCell><div className="h-4 w-16 bg-muted rounded ml-auto"></div></TableCell>
                                    <TableCell><div className="h-4 w-16 bg-muted rounded ml-auto"></div></TableCell>
                                    <TableCell><div className="h-4 w-12 bg-muted rounded ml-auto"></div></TableCell>
                                    <TableCell><div className="h-4 w-12 bg-muted rounded ml-auto"></div></TableCell>
                                    <TableCell><div className="h-4 w-12 bg-muted rounded ml-auto"></div></TableCell>
                                    <TableCell className="pr-6"><div className="h-4 w-12 bg-muted rounded ml-auto"></div></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            rates.map((rate) => {
                                const { symbol, desc } = getDisplayInfo(rate.name)
                                const todayIsPos = (rate.todayPct || 0) > 0
                                const todayIsNeu = (rate.todayPct || 0) === 0
                                const todayColor = todayIsNeu ? "text-muted-foreground" : todayIsPos ? "text-red-500" : "text-blue-500"

                                return (
                                    <TableRow key={rate.name} className="hover:bg-accent/50 cursor-pointer transition-colors border-border/40">
                                        <TableCell className="font-semibold text-foreground pl-6 whitespace-nowrap">
                                            {symbol}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-medium hidden md:table-cell hover:text-foreground transition-colors whitespace-nowrap">
                                            {desc}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-foreground pr-4 whitespace-nowrap">
                                            {rate.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className={`text-right font-medium pr-4 whitespace-nowrap flex flex-col items-end justify-center ${todayColor}`}>
                                            {rate.todayPct !== null && rate.todayPct !== undefined ? (
                                                <>
                                                    <span>{(todayIsPos ? "+" : "")}{rate.todayPct.toFixed(2)}%</span>
                                                    <span className="text-[10px] opacity-80">{(todayIsPos ? "+" : "")}{rate.todayAbs?.toFixed(2)}</span>
                                                </>
                                            ) : (
                                                <span>-</span>
                                            )}
                                        </TableCell>
                                        {renderPercentCell(rate.weekPct)}
                                        {renderPercentCell(rate.monthPct)}
                                        {renderPercentCell(rate.sixMonthPct)}
                                        {renderPercentCell(rate.yearPct)}
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
