"use client"

import { Label } from "@/components/ui/label"
import type { TransactionStats } from "./productHistoryUtils"

interface TransactionStatsGridProps {
  stats: TransactionStats
  year: number
}

export default function TransactionStatsGrid({ stats, year }: TransactionStatsGridProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Year {year} Statistics</span>
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            Total Sales
          </Label>
          <p className="font-semibold text-lg text-green-600 dark:text-green-400">
            {stats.totalSalesQuantity} units
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Rs {stats.totalSalesValue.toLocaleString()}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            Total Purchases
          </Label>
          <p className="font-semibold text-lg text-blue-600 dark:text-blue-400">
            {stats.totalPurchaseQuantity} units
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Rs {stats.totalPurchaseValue.toLocaleString()}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            Net Movement
          </Label>
          <p
            className={`font-semibold text-lg ${stats.netMovement >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}
          >
            {stats.netMovement} units
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {stats.netMovement >= 0 ? "Net Inflow" : "Net Outflow"}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            Profit Margin
          </Label>
          <p
            className={`font-semibold text-lg ${stats.profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            Rs {stats.profit.toLocaleString()}
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {stats.totalPurchaseValue > 0
              ? `${((stats.profit / stats.totalPurchaseValue) * 100).toFixed(1)}% margin`
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  )
}
