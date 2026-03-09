"use client"

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import StockThemeTab from './StockThemeTab'
import StockIndustryTab from './StockIndustryTab'

interface StockIndustryThemeTabProps {
    symbol: string
}

export default function StockIndustryThemeTab({ symbol }: StockIndustryThemeTabProps) {
    return (
        <Card className="w-full border-none shadow-none bg-transparent">
            <CardContent className="p-0">
                <Tabs defaultValue="industry" className="w-full">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList className="grid w-[400px] grid-cols-2">
                            <TabsTrigger value="industry">업종 (WICS)</TabsTrigger>
                            <TabsTrigger value="theme">테마 (Theme)</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="industry" className="mt-0">
                        <StockIndustryTab symbol={symbol} />
                    </TabsContent>

                    <TabsContent value="theme" className="mt-0">
                        <StockThemeTab symbol={symbol} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
