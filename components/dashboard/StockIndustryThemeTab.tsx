"use client"

import React from 'react'
import StockIndustryTab from './StockIndustryTab'

interface StockIndustryThemeTabProps {
    symbol: string
}

export default function StockIndustryThemeTab({ symbol }: StockIndustryThemeTabProps) {
    return <StockIndustryTab symbol={symbol} />
}
