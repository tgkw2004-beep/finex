"use client"

import StockIndustryTab from './StockIndustryTab'

interface StockIndustryThemeTabProps {
    symbol: string
}

export default function StockIndustryThemeTab({ symbol }: StockIndustryThemeTabProps) {
    return <StockIndustryTab symbol={symbol} />
}
