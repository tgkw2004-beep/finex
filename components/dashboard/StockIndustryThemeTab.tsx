"use client"

import StockIndustryTab from './StockIndustryTab'
import StockThemeTab from './StockThemeTab'

interface StockIndustryThemeTabProps {
    symbol: string
}

export default function StockIndustryThemeTab({ symbol }: StockIndustryThemeTabProps) {
    return (
        <div className="space-y-6">
            <StockIndustryTab symbol={symbol} />
            <StockThemeTab symbol={symbol} />
        </div>
    )
}
