import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"

interface Stock {
  name: string
  code: string
  price: string
  change: string
  changePercent: string
  isPositive: boolean
  volume?: string
  marketCap?: string
}

interface StockTableProps {
  stocks: Stock[]
  columns?: string[]
}

export function StockTable({
  stocks,
  columns = ["종목명", "현재가", "등락률", "거래량", "시가총액"],
}: StockTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/40">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column} className="whitespace-nowrap">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => (
            <TableRow key={stock.code} className="cursor-pointer hover:bg-accent/50 transition-colors">
              <TableCell className="min-w-[120px]">
                <Link href={`/dashboard/stock/${stock.code}`} className="block">
                  <div>
                    <div className="font-medium">{stock.name}</div>
                    <div className="text-xs text-muted-foreground">{stock.code}</div>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap font-medium">
                <Link href={`/dashboard/stock/${stock.code}`} className="block">
                  {stock.price}
                </Link>
              </TableCell>
              <TableCell className="min-w-[120px]">
                <Link href={`/dashboard/stock/${stock.code}`} className="block">
                  <div className="flex items-center gap-1">
                    {stock.isPositive ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={stock.isPositive ? "text-green-500" : "text-red-500"}>
                      {stock.change} ({stock.changePercent})
                    </span>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                <Link href={`/dashboard/stock/${stock.code}`} className="block">
                  {stock.volume}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                <Link href={`/dashboard/stock/${stock.code}`} className="block">
                  {stock.marketCap}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
