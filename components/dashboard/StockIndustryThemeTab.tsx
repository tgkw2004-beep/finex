"use client"

import StockThemeTab from './StockThemeTab'

interface StockIndustryThemeTabProps {
    symbol: string
}

export default function StockIndustryThemeTab({ symbol }: StockIndustryThemeTabProps) {
    return <StockThemeTab symbol={symbol} />
}
