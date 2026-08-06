"use client"

import { Label } from "@/components/ui/label"
import type { TransactionStats } from "./productHistoryUtils"

interface TransactionStatsGridProps {
 stats: TransactionStats
 year?: number
 yearLabel?: string
}

export default function TransactionStatsGrid({ stats, year, yearLabel }: TransactionStatsGridProps) {
 const label = yearLabel ?? (year != null ? `Year ${year}` : "All Time")

 return (
 <div className="bg-muted rounded-xl p-6">
 <h3 className="form-section-title">
 <div className="w-2 h-2 bg-muted rounded-full"></div>
 <span>{label} Statistics</span>
 </h3>
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 <div className="space-y-2">
 <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
 Total Sales
 </Label>
 <p className="text-lg font-semibold tracking-tight tabular-nums text-navy">
 {stats.totalSalesQuantity} units
 </p>
 <p className="amount-text-meta">
 Rs {stats.totalSalesValue.toLocaleString()}
 </p>
 </div>

 <div className="space-y-2">
 <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
 Total Purchases
 </Label>
 <p className="text-lg font-semibold tracking-tight tabular-nums text-navy">
 {stats.totalPurchaseQuantity} units
 </p>
 <p className="amount-text-meta">
 Rs {stats.totalPurchaseValue.toLocaleString()}
 </p>
 </div>

 <div className="space-y-2">
 <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
 Net Movement
 </Label>
 <p
 className={`text-lg font-semibold tracking-tight tabular-nums ${stats.netMovement >= 0 ? "text-navy" : "text-navy"}`}
 >
 {stats.netMovement} units
 </p>
 <p className="amount-text-meta">
 {stats.netMovement >= 0 ? "Net Inflow" : "Net Outflow"}
 </p>
 </div>

 <div className="space-y-2">
 <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
 Profit Margin
 </Label>
 <p
 className={`text-lg font-semibold tracking-tight tabular-nums ${stats.profit >= 0 ? "text-navy" : "text-navy"}`}
 >
 Rs {stats.profit.toLocaleString()}
 </p>
 <p className="amount-text-meta">
 {stats.totalPurchaseValue > 0
 ? `${((stats.profit / stats.totalPurchaseValue) * 100).toFixed(1)}% margin`
 : "N/A"}
 </p>
 </div>
 </div>
 </div>
 )
}
