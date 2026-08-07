"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useInventory } from "@/contexts/InventoryContext"
import {
  cn,
  formatDateForReports,
  getCurrentNepaliYear,
  getNepaliDay,
  getNepaliMonth,
  getNepaliYear,
  toTitleCase,
} from "@/lib/utils"
import { exportTableToExcel } from "@/utils/exportUtils"
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { useEffect, useId, useMemo, useState, type ComponentType, type ReactNode } from "react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

/** Restrained finance palette — brand teal + slate only */
const C = {
  sales: "#165e6c",
  purchases: "#8B9AAB",
  profit: "#165e6c",
  axis: "#94A3B8",
  grid: "rgba(148, 163, 184, 0.25)",
  cursor: "rgba(22, 94, 108, 0.06)",
}

const NEPALI_MONTHS = [
  "Baisakh",
  "Jestha",
  "Asar",
  "Shrawan",
  "Bhadra",
  "Ashoj",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
]

function formatRs(value: number) {
  return `Rs ${Number(value || 0).toLocaleString()}`
}

function formatCompactRs(value: number) {
  const n = Number(value || 0)
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return `${Math.round(n)}`
}

function saleTotal(sale: { items?: { quantitySold?: number; salePrice?: number }[] }) {
  return (sale.items || []).reduce(
    (sum, item) => sum + (item.quantitySold || 0) * (item.salePrice || 0),
    0
  )
}

function purchaseTotal(purchase: {
  items?: { quantityPurchased?: number; purchasePrice?: number }[]
}) {
  return (purchase.items || []).reduce(
    (sum, item) => sum + (item.quantityPurchased || 0) * (item.purchasePrice || 0),
    0
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/80 bg-background/95 px-3.5 py-2.5 shadow-md backdrop-blur-sm">
      {label ? <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-6 text-[12px]">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: entry.color || C.sales }}
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-navy">{formatRs(entry.value || 0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-3 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

function ChartCard({
  title,
  description,
  legend,
  children,
  className,
  action,
}: {
  title: string
  description?: string
  legend?: ReactNode
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <Card className={cn("report-print-block shadow-none", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-[15px] font-semibold tracking-tight">{title}</CardTitle>
          {description ? <CardDescription className="text-[12px]">{description}</CardDescription> : null}
          {legend ? <div className="pt-2">{legend}</div> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}

function TrendChart({
  data,
  xKey,
  labelKey,
  showProfit = false,
}: {
  data: Record<string, string | number>[]
  xKey: string
  labelKey?: string
  showProfit?: boolean
}) {
  const uid = useId().replace(/:/g, "")
  const salesGrad = `salesGrad-${uid}`
  const profitGrad = `profitGrad-${uid}`

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={salesGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.sales} stopOpacity={0.18} />
            <stop offset="100%" stopColor={C.sales} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id={profitGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.profit} stopOpacity={0.12} />
            <stop offset="100%" stopColor={C.profit} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={C.grid} strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fill: C.axis, fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fill: C.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={formatCompactRs}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: C.cursor }}
          labelFormatter={(_, payload) => {
            const row = payload?.[0]?.payload
            if (labelKey && row?.[labelKey]) return String(row[labelKey])
            return String(row?.[xKey] ?? "")
          }}
        />
        <Area
          type="monotone"
          dataKey="sales"
          name="Sales"
          stroke={C.sales}
          strokeWidth={2}
          fill={`url(#${salesGrad})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: C.sales }}
        />
        <Line
          type="monotone"
          dataKey="purchases"
          name="Purchases"
          stroke={C.purchases}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          activeDot={{ r: 3.5, strokeWidth: 2, stroke: "#fff", fill: C.purchases }}
        />
        {showProfit ? (
          <Area
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke={C.profit}
            strokeWidth={1.5}
            fill={`url(#${profitGrad})`}
            dot={false}
            activeDot={{ r: 3.5, strokeWidth: 2, stroke: "#fff", fill: C.profit }}
          />
        ) : null}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function ProfitChart({
  data,
  xKey,
  labelKey,
}: {
  data: Record<string, string | number>[]
  xKey: string
  labelKey?: string
}) {
  const uid = useId().replace(/:/g, "")
  const gradId = `profitOnly-${uid}`

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.profit} stopOpacity={0.2} />
            <stop offset="100%" stopColor={C.profit} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fill: C.axis, fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fill: C.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={formatCompactRs}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: C.sales, strokeWidth: 1, strokeDasharray: "4 4" }}
          labelFormatter={(_, payload) => {
            const row = payload?.[0]?.payload
            if (labelKey && row?.[labelKey]) return String(row[labelKey])
            return String(row?.[xKey] ?? "")
          }}
        />
        <Area
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke={C.profit}
          strokeWidth={2.25}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: C.profit }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function PaymentSplit({
  paid,
  unpaid,
}: {
  paid: number
  unpaid: number
}) {
  const total = paid + unpaid
  const paidPct = total > 0 ? (paid / total) * 100 : 0
  const unpaidPct = total > 0 ? (unpaid / total) * 100 : 0

  if (total <= 0) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-navy">No sales in this period</p>
        <p className="mt-1 text-xs text-muted-foreground">Payment mix will appear when sales are recorded</p>
      </div>
    )
  }

  return (
    <div className="flex h-[220px] flex-col justify-center gap-6">
      <div>
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Collection rate</p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums text-navy">
              {paidPct.toFixed(0)}
              <span className="text-lg font-medium text-muted-foreground">%</span>
            </p>
          </div>
          <p className="text-xs tabular-nums text-muted-foreground">{formatRs(total)} total</p>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-[#165e6c] transition-all duration-500"
            style={{ width: `${paidPct}%` }}
            title={`Received ${formatRs(paid)}`}
          />
          <div
            className="h-full bg-slate-300 transition-all duration-500 dark:bg-slate-600"
            style={{ width: `${unpaidPct}%` }}
            title={`Pending ${formatRs(unpaid)}`}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[#165e6c]" />
            Received
          </span>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums text-navy">{formatRs(paid)}</p>
            <p className="text-[11px] tabular-nums text-muted-foreground">{paidPct.toFixed(1)}%</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            Pending
          </span>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums text-navy">{formatRs(unpaid)}</p>
            <p className="text-[11px] tabular-nums text-muted-foreground">{unpaidPct.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RankList({
  items,
  emptyLabel,
  valueLabel = "Revenue",
}: {
  items: { id: string; name: string; value: number; meta?: string }[]
  emptyLabel: string
  valueLabel?: string
}) {
  const max = items[0]?.value || 1

  if (!items.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="space-y-4 py-1">
      {items.map((item, index) => {
        const pct = Math.max(4, (item.value / max) * 100)
        return (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="w-4 shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span className="truncate text-sm font-medium text-navy">{item.name}</span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-navy">
                {formatRs(item.value)}
              </span>
            </div>
            <div className="ml-6 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#165e6c]/85 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            {item.meta ? (
              <p className="ml-6 text-[11px] text-muted-foreground">
                {item.meta}
                <span className="sr-only"> {valueLabel}</span>
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function ChannelSplit({
  clientAmount,
  siteAmount,
}: {
  clientAmount: number
  siteAmount: number
}) {
  const total = clientAmount + siteAmount
  const clientPct = total > 0 ? (clientAmount / total) * 100 : 0
  const sitePct = total > 0 ? (siteAmount / total) * 100 : 0

  if (total <= 0) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-navy">No sales in this period</p>
        <p className="mt-1 text-xs text-muted-foreground">Client vs site mix will appear with sales</p>
      </div>
    )
  }

  return (
    <div className="flex h-[220px] flex-col justify-center gap-6">
      <div>
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Client share
            </p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums text-navy">
              {clientPct.toFixed(0)}
              <span className="text-lg font-medium text-muted-foreground">%</span>
            </p>
          </div>
          <p className="text-xs tabular-nums text-muted-foreground">{formatRs(total)} sales</p>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-[#165e6c] transition-all duration-500" style={{ width: `${clientPct}%` }} />
          <div
            className="h-full bg-slate-300 transition-all duration-500 dark:bg-slate-600"
            style={{ width: `${sitePct}%` }}
          />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[#165e6c]" />
            Client sales
          </span>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums text-navy">{formatRs(clientAmount)}</p>
            <p className="text-[11px] tabular-nums text-muted-foreground">{clientPct.toFixed(1)}%</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            Site / project
          </span>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums text-navy">{formatRs(siteAmount)}</p>
            <p className="text-[11px] tabular-nums text-muted-foreground">{sitePct.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string
  value: string
  hint?: string
  icon: ComponentType<{ className?: string }>
  tone?: "sales" | "purchases" | "profit" | "alert" | "neutral"
}) {
  const tones = {
    sales: "border-border",
    purchases: "border-border",
    profit: "border-border",
    alert: "border-border",
    neutral: "border-border",
  }
  const iconTones = {
    sales: "bg-[#165e6c]/8 text-[#165e6c]",
    purchases: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    profit: "bg-[#165e6c]/8 text-[#165e6c]",
    alert: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    neutral: "bg-muted text-navy/70",
  }
  return (
    <Card className={cn("report-print-block shadow-none", tones[tone])}>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-semibold tracking-tight tabular-nums text-navy sm:text-2xl">
            {value}
          </p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className={cn("rounded-md p-2", iconTones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  )
}

function formatPrintStamp(date = new Date()) {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
}

function shiftNepaliMonth(year: number, month: number, delta: number) {
  let nextMonth = month + delta
  let nextYear = year
  while (nextMonth < 1) {
    nextMonth += 12
    nextYear -= 1
  }
  while (nextMonth > 12) {
    nextMonth -= 12
    nextYear += 1
  }
  return { year: nextYear, month: nextMonth }
}

export default function ReportsPage() {
  const { products, purchases, sales } = useInventory()
  const [reportType, setReportType] = useState<"monthly" | "yearly">("monthly")
  const [printStamp, setPrintStamp] = useState(() => formatPrintStamp())
  const { toast } = useToast()

  const todayNepaliYear = getCurrentNepaliYear()
  const todayNepaliMonth = getNepaliMonth(new Date().toISOString())
  const [selectedYear, setSelectedYear] = useState(todayNepaliYear)
  const [selectedMonth, setSelectedMonth] = useState(todayNepaliMonth)

  useEffect(() => {
    const refreshStamp = () => setPrintStamp(formatPrintStamp())
    window.addEventListener("beforeprint", refreshStamp)
    return () => window.removeEventListener("beforeprint", refreshStamp)
  }, [])

  const handlePrint = () => {
    setPrintStamp(formatPrintStamp())
    // Let React paint the updated stamp before the print dialog opens
    requestAnimationFrame(() => window.print())
  }

  const availableYears = useMemo(() => {
    const years = new Set<number>([todayNepaliYear])
    sales.forEach((s) => {
      try {
        years.add(getNepaliYear(s.saleDate))
      } catch {
        /* ignore bad dates */
      }
    })
    purchases.forEach((p) => {
      try {
        years.add(getNepaliYear(p.purchaseDate))
      } catch {
        /* ignore bad dates */
      }
    })
    // Always offer a short lookback even if data is empty
    for (let y = todayNepaliYear; y >= todayNepaliYear - 5; y -= 1) years.add(y)
    years.add(selectedYear)
    return Array.from(years)
      .filter((y) => Number.isFinite(y) && y > 2000)
      .sort((a, b) => b - a)
  }, [sales, purchases, todayNepaliYear, selectedYear])

  const isCurrentMonth = selectedYear === todayNepaliYear && selectedMonth === todayNepaliMonth
  const isCurrentYear = selectedYear === todayNepaliYear

  const goToPreviousPeriod = () => {
    if (reportType === "monthly") {
      const prev = shiftNepaliMonth(selectedYear, selectedMonth, -1)
      setSelectedYear(prev.year)
      setSelectedMonth(prev.month)
      return
    }
    setSelectedYear((y) => y - 1)
  }

  const goToNextPeriod = () => {
    if (reportType === "monthly") {
      const next = shiftNepaliMonth(selectedYear, selectedMonth, 1)
      // Don't go past the current Nepali month
      if (next.year > todayNepaliYear || (next.year === todayNepaliYear && next.month > todayNepaliMonth)) {
        return
      }
      setSelectedYear(next.year)
      setSelectedMonth(next.month)
      return
    }
    if (selectedYear >= todayNepaliYear) return
    setSelectedYear((y) => y + 1)
  }

  const canGoNext =
    reportType === "monthly"
      ? !(selectedYear === todayNepaliYear && selectedMonth === todayNepaliMonth)
      : selectedYear < todayNepaliYear

  const resetToCurrent = () => {
    setSelectedYear(todayNepaliYear)
    setSelectedMonth(todayNepaliMonth)
  }

  const productNameById = useMemo(() => {
    const map = new Map<string, string>()
    products.forEach((p) => map.set(p.id, p.name))
    return map
  }, [products])

  const resolveProductName = (productId?: string, productName?: string) => {
    if (productName?.trim()) return toTitleCase(productName)
    if (productId && productNameById.has(productId)) return toTitleCase(productNameById.get(productId)!)
    return productId ? toTitleCase(productId) : "—"
  }

  const inSelectedPeriod = (dateStr: string) => {
    if (reportType === "monthly") {
      return getNepaliYear(dateStr) === selectedYear && getNepaliMonth(dateStr) === selectedMonth
    }
    return getNepaliYear(dateStr) === selectedYear
  }

  const periodSales = useMemo(
    () => sales.filter((s) => inSelectedPeriod(s.saleDate)),
    [sales, reportType, selectedYear, selectedMonth]
  )

  const periodPurchases = useMemo(
    () => purchases.filter((p) => inSelectedPeriod(p.purchaseDate)),
    [purchases, reportType, selectedYear, selectedMonth]
  )

  /** Weekly buckets by Nepali day-of-month for the selected Bikram Sambat month */
  const weeklyData = useMemo(() => {
    const weeks = [
      { week: "W1", start: 1, end: 7 },
      { week: "W2", start: 8, end: 14 },
      { week: "W3", start: 15, end: 21 },
      { week: "W4", start: 22, end: 28 },
      { week: "W5", start: 29, end: 32 },
    ]

    const inMonth = (dateStr: string) =>
      getNepaliYear(dateStr) === selectedYear && getNepaliMonth(dateStr) === selectedMonth

    return weeks
      .map(({ week, start, end }) => {
        const weekSales = sales
          .filter((s) => {
            if (!inMonth(s.saleDate)) return false
            const day = getNepaliDay(s.saleDate)
            return day >= start && day <= end
          })
          .reduce((sum, s) => sum + saleTotal(s), 0)

        const weekPurchases = purchases
          .filter((p) => {
            if (!inMonth(p.purchaseDate)) return false
            const day = getNepaliDay(p.purchaseDate)
            return day >= start && day <= end
          })
          .reduce((sum, p) => sum + purchaseTotal(p), 0)

        return {
          week,
          label: week.replace("W", "Week "),
          sales: weekSales,
          purchases: weekPurchases,
          profit: weekSales - weekPurchases,
        }
      })
      .filter((row, index) => index < 4 || row.sales > 0 || row.purchases > 0)
  }, [sales, purchases, selectedYear, selectedMonth])

  const monthlyBreakdown = useMemo(() => {
    return NEPALI_MONTHS.map((monthName, index) => {
      const monthNumber = index + 1
      const monthSalesList = sales.filter(
        (s) => getNepaliYear(s.saleDate) === selectedYear && getNepaliMonth(s.saleDate) === monthNumber
      )
      const monthPurchasesList = purchases.filter(
        (p) =>
          getNepaliYear(p.purchaseDate) === selectedYear && getNepaliMonth(p.purchaseDate) === monthNumber
      )

      const monthSales = monthSalesList.reduce((sum, s) => sum + saleTotal(s), 0)
      const monthPurchases = monthPurchasesList.reduce((sum, p) => sum + purchaseTotal(p), 0)

      return {
        month: monthName,
        shortMonth: monthName.slice(0, 3),
        sales: monthSales,
        purchases: monthPurchases,
        profit: monthSales - monthPurchases,
        transactions: monthSalesList.length + monthPurchasesList.length,
      }
    })
  }, [sales, purchases, selectedYear])

  const periodStats = useMemo(() => {
    const inMonth = (dateStr: string) =>
      getNepaliYear(dateStr) === selectedYear && getNepaliMonth(dateStr) === selectedMonth

    const inYear = (dateStr: string) => getNepaliYear(dateStr) === selectedYear

    const monthSalesList = sales.filter((s) => inMonth(s.saleDate))
    const monthPurchasesList = purchases.filter((p) => inMonth(p.purchaseDate))
    const yearSalesList = sales.filter((s) => inYear(s.saleDate))
    const yearPurchasesList = purchases.filter((p) => inYear(p.purchaseDate))

    const monthlySales = monthSalesList.reduce((sum, s) => sum + saleTotal(s), 0)
    const monthlyPurchases = monthPurchasesList.reduce((sum, p) => sum + purchaseTotal(p), 0)
    const yearlySales = yearSalesList.reduce((sum, s) => sum + saleTotal(s), 0)
    const yearlyPurchases = yearPurchasesList.reduce((sum, p) => sum + purchaseTotal(p), 0)

    const monthlyProfit = monthlySales - monthlyPurchases
    const yearlyProfit = yearlySales - yearlyPurchases

    const unpaidSales = yearSalesList
      .filter((s) => (s.paymentStatus || "Pending") === "Pending")
      .reduce((sum, s) => sum + saleTotal(s), 0)
    const paidSales = yearSalesList
      .filter((s) => s.paymentStatus === "Received")
      .reduce((sum, s) => sum + saleTotal(s), 0)

    const monthUnpaid = monthSalesList
      .filter((s) => (s.paymentStatus || "Pending") === "Pending")
      .reduce((sum, s) => sum + saleTotal(s), 0)
    const monthPaid = monthSalesList
      .filter((s) => s.paymentStatus === "Received")
      .reduce((sum, s) => sum + saleTotal(s), 0)

    return {
      monthlySales,
      monthlyPurchases,
      monthlyProfit,
      monthlyMargin: monthlySales > 0 ? (monthlyProfit / monthlySales) * 100 : 0,
      monthlyTx: monthSalesList.length + monthPurchasesList.length,
      yearlySales,
      yearlyPurchases,
      yearlyProfit,
      yearlyMargin: yearlySales > 0 ? (yearlyProfit / yearlySales) * 100 : 0,
      yearlyTx: yearSalesList.length + yearPurchasesList.length,
      unpaidSales,
      paidSales,
      monthUnpaid,
      monthPaid,
    }
  }, [sales, purchases, selectedYear, selectedMonth])

  const topProducts = useMemo(() => {
    const qty: Record<string, number> = {}
    const rev: Record<string, number> = {}

    periodSales.forEach((sale) => {
      ;(sale.items || []).forEach((item) => {
        const key = item.productId || item.productName
        if (!key) return
        qty[key] = (qty[key] || 0) + (item.quantitySold || 0)
        rev[key] = (rev[key] || 0) + (item.quantitySold || 0) * (item.salePrice || 0)
      })
    })

    return Object.keys(qty)
      .map((key) => {
        const product = products.find((p) => p.id === key)
        const sampleName = periodSales
          .flatMap((s) => s.items || [])
          .find((i) => i.productId === key || i.productName === key)?.productName
        return {
          id: key,
          name: resolveProductName(product?.id || key, product?.name || sampleName),
          value: rev[key] || 0,
          meta: `${qty[key] || 0} units sold`,
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [periodSales, products, productNameById])

  const topClients = useMemo(() => {
    const map = new Map<string, { revenue: number; unpaid: number; orders: number }>()

    periodSales.forEach((sale) => {
      const name = sale.client?.trim() || "Unknown"
      const amount = saleTotal(sale)
      const prev = map.get(name) || { revenue: 0, unpaid: 0, orders: 0 }
      prev.revenue += amount
      prev.orders += 1
      if ((sale.paymentStatus || "Pending") === "Pending") prev.unpaid += amount
      map.set(name, prev)
    })

    return Array.from(map.entries())
      .map(([name, stats]) => ({
        id: name,
        name: toTitleCase(name),
        value: stats.revenue,
        meta:
          stats.unpaid > 0
            ? `${stats.orders} orders · ${formatRs(stats.unpaid)} unpaid`
            : `${stats.orders} orders`,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [periodSales])

  const topSuppliers = useMemo(() => {
    const map = new Map<string, { spend: number; orders: number }>()

    periodPurchases.forEach((purchase) => {
      const name = purchase.supplier?.trim() || "Unknown"
      const amount = purchaseTotal(purchase)
      const prev = map.get(name) || { spend: 0, orders: 0 }
      prev.spend += amount
      prev.orders += 1
      map.set(name, prev)
    })

    return Array.from(map.entries())
      .map(([name, stats]) => ({
        id: name,
        name: toTitleCase(name),
        value: stats.spend,
        meta: `${stats.orders} purchases`,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [periodPurchases])

  const channelMix = useMemo(() => {
    let clientAmount = 0
    let siteAmount = 0
    periodSales.forEach((sale) => {
      const amount = saleTotal(sale)
      if ((sale.saleType || "client") === "site") siteAmount += amount
      else clientAmount += amount
    })
    return { clientAmount, siteAmount }
  }, [periodSales])

  const recentActivity = useMemo(() => {
    const saleRows = periodSales.map((sale) => {
      const items = sale.items || []
      return {
        id: `sale-${sale.id}`,
        type: "Sale" as const,
        date: sale.saleDate,
        party: sale.client,
        products: items.map((item) => resolveProductName(item.productId, item.productName)).join(", ") || "—",
        quantity: items.reduce((sum, item) => sum + (item.quantitySold || 0), 0),
        amount: saleTotal(sale),
      }
    })

    const purchaseRows = periodPurchases.map((purchase) => {
      const items = purchase.items || []
      return {
        id: `purchase-${purchase.id}`,
        type: "Purchase" as const,
        date: purchase.purchaseDate,
        party: purchase.supplier,
        products: items.map((item) => resolveProductName(item.productId, item.productName)).join(", ") || "—",
        quantity: items.reduce((sum, item) => sum + (item.quantityPurchased || 0), 0),
        amount: purchaseTotal(purchase),
      }
    })

    return [...saleRows, ...purchaseRows]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
  }, [periodSales, periodPurchases, productNameById])

  const selectedMonthName = NEPALI_MONTHS[selectedMonth - 1] || "Month"

  const activeKpis =
    reportType === "monthly"
      ? {
          sales: periodStats.monthlySales,
          purchases: periodStats.monthlyPurchases,
          profit: periodStats.monthlyProfit,
          margin: periodStats.monthlyMargin,
          tx: periodStats.monthlyTx,
          paid: periodStats.monthPaid,
          unpaid: periodStats.monthUnpaid,
          periodLabel: `${selectedMonthName} ${selectedYear}`,
        }
      : {
          sales: periodStats.yearlySales,
          purchases: periodStats.yearlyPurchases,
          profit: periodStats.yearlyProfit,
          margin: periodStats.yearlyMargin,
          tx: periodStats.yearlyTx,
          paid: periodStats.paidSales,
          unpaid: periodStats.unpaidSales,
          periodLabel: `NS ${selectedYear}`,
        }

  const exportReport = () => {
    if (reportType === "monthly") {
      if (!weeklyData.length) {
        toast({ title: "No monthly data", description: "There is no monthly report to export.", variant: "destructive" })
        return
      }
      exportTableToExcel(
        weeklyData.map((row) => ({
          week: row.label,
          sales: formatRs(row.sales),
          purchases: formatRs(row.purchases),
          profit: formatRs(row.profit),
        })),
        `monthly_report_${new Date().toISOString().split("T")[0]}`,
        {
          sheetName: "Monthly Report",
          title: `Monthly Report — ${activeKpis.periodLabel}`,
          columns: [
            { key: "week", header: "Week", width: 12 },
            { key: "sales", header: "Sales", width: 18 },
            { key: "purchases", header: "Purchases", width: 18 },
            { key: "profit", header: "Profit", width: 18 },
          ],
        }
      )
      return
    }

    if (!monthlyBreakdown.length) {
      toast({ title: "No yearly data", description: "There is no yearly report to export.", variant: "destructive" })
      return
    }
    exportTableToExcel(
      monthlyBreakdown.map((row) => ({
        month: row.month,
        sales: formatRs(row.sales),
        purchases: formatRs(row.purchases),
        profit: formatRs(row.profit),
        transactions: row.transactions,
      })),
      `yearly_report_${new Date().toISOString().split("T")[0]}`,
      {
        sheetName: "Yearly Summary",
        title: `Yearly Summary — ${selectedYear}`,
        columns: [
          { key: "month", header: "Month", width: 14 },
          { key: "sales", header: "Sales", width: 18 },
          { key: "purchases", header: "Purchases", width: 18 },
          { key: "profit", header: "Profit", width: 18 },
          { key: "transactions", header: "Transactions", width: 14 },
        ],
      }
    )
  }

  const trendLegend = (
    <ChartLegend
      items={[
        { label: "Sales", color: C.sales },
        { label: "Purchases", color: C.purchases },
      ]}
    />
  )

  return (
    <div className="report-print-root min-h-screen space-y-5 transition-colors duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="section-title">Reports</h1>
          <p className="page-desc">
            Live overview from your current sales, purchases, and stock — updates as you add records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button type="button" variant="outline" onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button type="button" variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <p className="report-print-timestamp" aria-hidden="true">
        Printed on {printStamp}
      </p>

      <Tabs
        value={reportType}
        onValueChange={(value) => setReportType(value as "monthly" | "yearly")}
        className="w-full"
      >
        <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="monthly" className="gap-2">
              <Calendar className="h-4 w-4" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Yearly
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={goToPreviousPeriod}
              aria-label={reportType === "monthly" ? "Previous month" : "Previous year"}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {reportType === "monthly" ? (
              <Select
                value={String(selectedMonth)}
                onValueChange={(value) => setSelectedMonth(Number(value))}
              >
                <SelectTrigger className="h-10 w-[140px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {NEPALI_MONTHS.map((name, index) => (
                    <SelectItem key={name} value={String(index + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            <Select
              value={String(selectedYear)}
              onValueChange={(value) => setSelectedYear(Number(value))}
            >
              <SelectTrigger className="h-10 w-[110px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={goToNextPeriod}
              disabled={!canGoNext}
              aria-label={reportType === "monthly" ? "Next month" : "Next year"}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-10 px-3 text-sm"
              onClick={resetToCurrent}
              disabled={reportType === "monthly" ? isCurrentMonth : isCurrentYear}
            >
              {reportType === "monthly" ? "This month" : "This year"}
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-navy">
              Profit overview · <span className="text-muted-foreground">{activeKpis.periodLabel}</span>
              {(reportType === "monthly" ? !isCurrentMonth : !isCurrentYear) ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">(historical)</span>
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground print:hidden">Live data · selected period</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Sales"
              value={formatRs(activeKpis.sales)}
              hint={`${activeKpis.tx} transactions in period`}
              icon={TrendingUp}
              tone="sales"
            />
            <KpiCard
              label="Purchases"
              value={formatRs(activeKpis.purchases)}
              hint="Cost of goods bought"
              icon={TrendingDown}
              tone="purchases"
            />
            <KpiCard
              label="Net profit"
              value={formatRs(activeKpis.profit)}
              hint={`Margin ${activeKpis.margin.toFixed(1)}%`}
              icon={Wallet}
              tone="profit"
            />
            <KpiCard
              label="Unpaid sales"
              value={formatRs(activeKpis.unpaid)}
              hint={`Received ${formatRs(activeKpis.paid)}`}
              icon={AlertTriangle}
              tone={activeKpis.unpaid > 0 ? "alert" : "neutral"}
            />
          </div>

          {/* Only the active period is mounted — print never includes the other tab */}
          {reportType === "monthly" ? (
            <div className="space-y-4" data-report-period="monthly">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <ChartCard
                  className="xl:col-span-2"
                  title="Sales & purchases trend"
                  description={`Weekly movement for ${selectedMonthName} ${selectedYear}`}
                  legend={trendLegend}
                >
                  <TrendChart data={weeklyData} xKey="week" labelKey="label" />
                </ChartCard>

                <ChartCard
                  title="Payment collection"
                  description={`Received vs pending · ${selectedMonthName} ${selectedYear}`}
                >
                  <PaymentSplit paid={activeKpis.paid} unpaid={activeKpis.unpaid} />
                </ChartCard>
              </div>

              <ChartCard title="Profit trend" description="Weekly net (sales − purchases)">
                <ProfitChart data={weeklyData} xKey="week" labelKey="label" />
              </ChartCard>
            </div>
          ) : (
            <div className="space-y-4" data-report-period="yearly">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <ChartCard
                  className="xl:col-span-2"
                  title="Sales & purchases trend"
                  description={`Nepali year ${selectedYear}`}
                  legend={trendLegend}
                >
                  <TrendChart data={monthlyBreakdown} xKey="shortMonth" labelKey="month" />
                </ChartCard>

                <ChartCard
                  title="Payment collection"
                  description={`Received vs pending · NS ${selectedYear}`}
                >
                  <PaymentSplit paid={activeKpis.paid} unpaid={activeKpis.unpaid} />
                </ChartCard>
              </div>

              <ChartCard title="Profit trend" description="Monthly net across the year">
                <ProfitChart data={monthlyBreakdown} xKey="shortMonth" labelKey="month" />
              </ChartCard>

              <Card className="report-print-block report-print-allow-break shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[15px] font-semibold tracking-tight">Yearly summary</CardTitle>
                  <CardDescription className="text-[12px]">
                    Month-by-month totals for NS {selectedYear}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Sales</TableHead>
                          <TableHead className="text-right">Purchases</TableHead>
                          <TableHead className="text-right">Profit</TableHead>
                          <TableHead className="text-right">Tx</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyBreakdown.map((data) => (
                          <TableRow key={data.month}>
                            <TableCell className="font-medium text-navy">{data.month}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatRs(data.sales)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatRs(data.purchases)}</TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-medium tabular-nums",
                                data.profit >= 0 ? "text-[#165e6c]" : "text-red-600"
                              )}
                            >
                              {formatRs(data.profit)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {data.transactions}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Tabs>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Top products"
          description={`Highest revenue in ${activeKpis.periodLabel.toLowerCase()}`}
        >
          <RankList items={topProducts} emptyLabel="No product sales in this period" />
        </ChartCard>

        <ChartCard
          title="Top clients"
          description="Who drives revenue — and how much is still unpaid"
        >
          <RankList items={topClients} emptyLabel="No client sales in this period" />
        </ChartCard>

        <ChartCard
          title="Top suppliers"
          description="Where purchase spend is concentrated"
        >
          <RankList items={topSuppliers} emptyLabel="No purchases in this period" valueLabel="Spend" />
        </ChartCard>

        <ChartCard
          title="Sales channel"
          description="Client sales vs site / project work"
        >
          <ChannelSplit
            clientAmount={channelMix.clientAmount}
            siteAmount={channelMix.siteAmount}
          />
        </ChartCard>
      </div>

      <Card className="report-print-block report-print-allow-break shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-[15px] font-semibold tracking-tight">Recent activity</CardTitle>
          <CardDescription className="text-[12px]">Latest sales and purchases</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="whitespace-nowrap text-sm text-navy">
                      {formatDateForReports(activity.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {activity.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate text-sm font-medium text-navy">
                      {toTitleCase(activity.party || "—")}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                      {activity.products}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-navy">{activity.quantity}</TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums text-navy">
                      {formatRs(activity.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {recentActivity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No transactions yet
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
