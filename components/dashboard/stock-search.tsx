"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StockResult {
    stock_code: string
    stock_name: string
    // market_name: string // Removed as not available
}

export function StockSearch() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<StockResult[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchStocks = async () => {
            if (query.length < 1) {
                setResults([])
                return
            }

            setLoading(true)
            try {
                const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`)
                if (response.ok) {
                    const data = await response.json()
                    setResults(data.results || [])
                }
            } catch (error) {
                console.error("Failed to search stocks:", error)
            } finally {
                setLoading(false)
            }
        }

        const debounce = setTimeout(fetchStocks, 300)
        return () => clearTimeout(debounce)
    }, [query])

    const handleSelect = (stockCode: string) => {
        setOpen(false)
        router.push(`/dashboard/stock/${stockCode}`)
    }

    return (
        <div className="relative w-full">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between text-muted-foreground"
                    >
                        <span className="flex items-center gap-2 truncate">
                            <Search className="h-4 w-4 shrink-0 opacity-50" />
                            {query ? query : "종목 검색..."}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="종목명 또는 코드 입력..."
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            {loading && <div className="py-6 text-center text-sm text-muted-foreground">검색 중...</div>}
                            {!loading && results.length === 0 && query.length > 0 && (
                                <CommandEmpty>검색된 종목이 없습니다.</CommandEmpty>
                            )}
                            <CommandGroup heading="검색 결과">
                                {results.map((stock) => (
                                    <CommandItem
                                        key={stock.stock_code}
                                        value={stock.stock_code}
                                        onSelect={() => handleSelect(stock.stock_code)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{stock.stock_name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {stock.stock_code}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
