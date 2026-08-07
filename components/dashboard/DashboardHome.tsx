"use client"

import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useInventory } from "@/contexts/InventoryContext"
import { cn, formatNepaliDateForTable } from "@/lib/utils"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

function formatRs(value: number) {
  return `Rs ${value.toLocaleString()}`
}

/**
 * Hover/accent tone matches meaning — not always brand green.
 * Status colors only show at rest when something needs attention.
 */
type Tone =
  | "sales"
  | "purchases"
  | "profit"
  | "alert"
  | "clients"
  | "suppliers"
  | "inventory"
  | "expense"
  | "danger"
  | "neutral"

const toneStyles: Record<
  Tone,
  {
    hoverCard: string
    bar: string
    barHover: string
    iconRest: string
    iconActive: string
    iconHover: string
    value: string
    linkHover: string
    amountHover: string
    panelHover: string
    panelBarHover: string
    panelIconHover: string
  }
> = (() => {
  const plain = {
    hoverCard: "hover:border-border hover:bg-muted/60",
    bar: "bg-navy",
    barHover: "group-hover:bg-navy",
    iconRest: "bg-muted text-navy/70",
    iconActive: "bg-foreground text-background",
    iconHover: "group-hover:bg-muted group-hover:text-navy",
    value: "text-navy",
    linkHover: "hover:text-navy",
    amountHover: "group-hover:text-navy",
    panelHover: "hover:border-border",
    panelBarHover: "group-hover/panel:bg-navy",
    panelIconHover: "group-hover/panel:bg-muted group-hover/panel:text-navy",
  }
  return {
    // Colored KPI cards: neutral bg at rest → tinted bg only on hover.
    sales: {
      hoverCard:
        "border-emerald-500 hover:border-emerald-700 hover:bg-emerald-50 dark:border-emerald-400 dark:hover:border-emerald-300 dark:hover:bg-emerald-950",
      bar: "bg-emerald-500 dark:bg-emerald-400",
      barHover: "group-hover:bg-emerald-700 dark:group-hover:bg-emerald-300",
      iconRest:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
      iconActive:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
      iconHover:
        "group-hover:bg-emerald-200 group-hover:text-emerald-900 dark:group-hover:bg-emerald-800 dark:group-hover:text-emerald-100",
      value:
        "text-emerald-700 transition-colors group-hover:text-emerald-900 dark:text-emerald-300 dark:group-hover:text-emerald-100",
      linkHover:
        "text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100",
      amountHover:
        "text-emerald-700 group-hover:text-emerald-900 dark:text-emerald-300 dark:group-hover:text-emerald-100",
      panelHover:
        "border-emerald-500 hover:border-emerald-700 hover:bg-emerald-50 dark:border-emerald-400 dark:hover:border-emerald-300 dark:hover:bg-emerald-950",
      panelBarHover: "group-hover/panel:bg-emerald-700 dark:group-hover/panel:bg-emerald-300",
      panelIconHover:
        "group-hover/panel:bg-emerald-200 group-hover/panel:text-emerald-900 dark:group-hover/panel:bg-emerald-800 dark:group-hover/panel:text-emerald-100",
    },
    purchases: {
      hoverCard:
        "border-amber-500 hover:border-amber-700 hover:bg-amber-50 dark:border-amber-400 dark:hover:border-amber-300 dark:hover:bg-amber-950",
      bar: "bg-amber-500 dark:bg-amber-400",
      barHover: "group-hover:bg-amber-700 dark:group-hover:bg-amber-300",
      iconRest:
        "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
      iconActive:
        "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
      iconHover:
        "group-hover:bg-amber-200 group-hover:text-amber-900 dark:group-hover:bg-amber-800 dark:group-hover:text-amber-100",
      value:
        "text-amber-700 transition-colors group-hover:text-amber-900 dark:text-amber-300 dark:group-hover:text-amber-100",
      linkHover:
        "text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100",
      amountHover:
        "text-amber-700 group-hover:text-amber-900 dark:text-amber-300 dark:group-hover:text-amber-100",
      panelHover:
        "border-amber-500 hover:border-amber-700 hover:bg-amber-50 dark:border-amber-400 dark:hover:border-amber-300 dark:hover:bg-amber-950",
      panelBarHover: "group-hover/panel:bg-amber-700 dark:group-hover/panel:bg-amber-300",
      panelIconHover:
        "group-hover/panel:bg-amber-200 group-hover/panel:text-amber-900 dark:group-hover/panel:bg-amber-800 dark:group-hover/panel:text-amber-100",
    },
    profit: {
      hoverCard:
        "border-teal-500 hover:border-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:hover:border-teal-300 dark:hover:bg-teal-950",
      bar: "bg-teal-500 dark:bg-teal-400",
      barHover: "group-hover:bg-teal-700 dark:group-hover:bg-teal-300",
      iconRest: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
      iconActive: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
      iconHover:
        "group-hover:bg-teal-200 group-hover:text-teal-900 dark:group-hover:bg-teal-800 dark:group-hover:text-teal-100",
      value:
        "text-teal-700 transition-colors group-hover:text-teal-900 dark:text-teal-300 dark:group-hover:text-teal-100",
      linkHover:
        "text-teal-700 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-100",
      amountHover:
        "text-teal-700 group-hover:text-teal-900 dark:text-teal-300 dark:group-hover:text-teal-100",
      panelHover:
        "border-teal-500 hover:border-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:hover:border-teal-300 dark:hover:bg-teal-950",
      panelBarHover: "group-hover/panel:bg-teal-700 dark:group-hover/panel:bg-teal-300",
      panelIconHover:
        "group-hover/panel:bg-teal-200 group-hover/panel:text-teal-900 dark:group-hover/panel:bg-teal-800 dark:group-hover/panel:text-teal-100",
    },
    danger: {
      hoverCard:
        "border-red-500 hover:border-red-700 hover:bg-red-50 dark:border-red-400 dark:hover:border-red-300 dark:hover:bg-red-950",
      bar: "bg-red-500 dark:bg-red-400",
      barHover: "group-hover:bg-red-700 dark:group-hover:bg-red-300",
      iconRest: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      iconActive: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      iconHover:
        "group-hover:bg-red-200 group-hover:text-red-900 dark:group-hover:bg-red-800 dark:group-hover:text-red-100",
      value:
        "text-red-700 transition-colors group-hover:text-red-900 dark:text-red-300 dark:group-hover:text-red-100",
      linkHover:
        "text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100",
      amountHover:
        "text-red-700 group-hover:text-red-900 dark:text-red-300 dark:group-hover:text-red-100",
      panelHover:
        "border-red-500 hover:border-red-700 hover:bg-red-50 dark:border-red-400 dark:hover:border-red-300 dark:hover:bg-red-950",
      panelBarHover: "group-hover/panel:bg-red-700 dark:group-hover/panel:bg-red-300",
      panelIconHover:
        "group-hover/panel:bg-red-200 group-hover/panel:text-red-900 dark:group-hover/panel:bg-red-800 dark:group-hover/panel:text-red-100",
    },
    alert: {
      hoverCard:
        "border-orange-500 hover:border-orange-700 hover:bg-orange-50 dark:border-orange-400 dark:hover:border-orange-300 dark:hover:bg-orange-950",
      bar: "bg-orange-500 dark:bg-orange-400",
      barHover: "group-hover:bg-orange-700 dark:group-hover:bg-orange-300",
      iconRest: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      iconActive: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      iconHover:
        "group-hover:bg-orange-200 group-hover:text-orange-900 dark:group-hover:bg-orange-800 dark:group-hover:text-orange-100",
      value:
        "text-orange-700 transition-colors group-hover:text-orange-900 dark:text-orange-300 dark:group-hover:text-orange-100",
      linkHover:
        "text-orange-700 hover:text-orange-900 dark:text-orange-300 dark:hover:text-orange-100",
      amountHover:
        "text-orange-700 group-hover:text-orange-900 dark:text-orange-300 dark:group-hover:text-orange-100",
      panelHover:
        "border-orange-500 hover:border-orange-700 hover:bg-orange-50 dark:border-orange-400 dark:hover:border-orange-300 dark:hover:bg-orange-950",
      panelBarHover: "group-hover/panel:bg-orange-700 dark:group-hover/panel:bg-orange-300",
      panelIconHover:
        "group-hover/panel:bg-orange-200 group-hover/panel:text-orange-900 dark:group-hover/panel:bg-orange-800 dark:group-hover/panel:text-orange-100",
    },
    clients: plain,
    suppliers: plain,
    inventory: plain,
    expense: plain,
    neutral: plain,
  }
})()

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = "sales",
  active = false,
  onClick,
  iconWrapperClassName,
}: {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: Tone
  /** Show tone color at rest (alerts, loss, etc.) */
  active?: boolean
  onClick?: () => void
  iconWrapperClassName?: string
}) {
  const t = toneStyles[tone]
  const Comp = onClick ? "button" : "div"

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-lg border border-border/80 bg-card p-4 text-left shadow-[var(--card-shadow)] transition-all duration-200 hover:shadow-sm",
        t.hoverCard,
        onClick && "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1 transition-colors duration-200",
          active ? cn(t.bar, t.barHover) : cn("bg-transparent", t.barHover),
        )}
      />
      <div className="flex items-start justify-between gap-3 pl-1.5">
        <div className="min-w-0 space-y-1">
          <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "truncate font-sans text-2xl font-semibold tracking-tight tabular-nums",
              active ? t.value : "text-navy",
            )}
          >
            {value}
          </p>
          {hint ? <p className="font-sans text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
            active ? cn(t.iconActive, t.iconHover) : cn(t.iconRest, t.iconHover),
            iconWrapperClassName,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Comp>
  )
}

function Panel({
  children,
  className,
  tone = "sales",
  active = false,
}: {
  children: ReactNode
  className?: string
  tone?: Tone
  active?: boolean
}) {
  const t = toneStyles[tone]
  return (
    <Card
      className={cn(
        "group/panel relative overflow-hidden transition-all duration-200 hover:shadow-sm",
        t.panelHover,
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 transition-colors duration-200",
          active ? cn(t.bar, t.panelBarHover) : cn("bg-transparent", t.panelBarHover),
        )}
      />
      {children}
    </Card>
  )
}

function PanelIcon({
  tone = "sales",
  active = false,
  children,
  className,
}: {
  tone?: Tone
  active?: boolean
  children: ReactNode
  className?: string
}) {
  const t = toneStyles[tone]
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200",
        active ? cn(t.iconActive, t.panelIconHover) : cn(t.iconRest, t.panelIconHover),
        className,
      )}
    >
      {children}
    </span>
  )
}

function ListRow({
  children,
  onClick,
  tone,
}: {
  children: ReactNode
  onClick?: () => void
  tone?: Tone
}) {
  const Comp = onClick ? "button" : "li"
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group -mx-2 flex w-full items-center justify-between gap-3 rounded-md px-2 py-2.5 text-left transition-colors duration-150",
        tone === "sales"
          ? "hover:bg-emerald-100 dark:hover:bg-emerald-900"
          : "hover:bg-muted/60",
        onClick && "cursor-pointer",
      )}
    >
      {children}
    </Comp>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center font-sans text-sm font-normal italic text-muted-foreground">
      {message}
    </p>
  )
}

function ViewLink({
  label,
  onClick,
  tone = "sales",
}: {
  label: string
  onClick: () => void
  tone?: Tone
}) {
  const t = toneStyles[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 font-sans text-xs font-medium transition-colors duration-200",
        tone === "sales" ? t.linkHover : cn("text-muted-foreground", t.linkHover),
      )}
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </button>
  )
}

function Amount({
  children,
  tone = "sales",
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  const t = toneStyles[tone]
  return (
    <span
      className={cn(
        "shrink-0 font-sans text-sm font-medium tabular-nums transition-colors duration-200",
        tone === "sales" ? t.amountHover : cn("text-navy", t.amountHover),
        className,
      )}
    >
      {children}
    </span>
  )
}

interface DashboardHomeProps {
  onNavigate?: (tab: string) => void
}

export default function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const {
    products,
    purchases,
    sales,
    clients,
    suppliers,
    getLowStockProducts,
    getTotalPurchases,
  } = useInventory()

  const go = (tab: string) => onNavigate?.(tab)

  const lowStockProducts = getLowStockProducts()
  const totalPurchases = getTotalPurchases()

  const getSaleAmount = (sale: (typeof sales)[number]) =>
    (sale.items || []).reduce(
      (sum, item) => sum + (item.quantitySold || 0) * (item.salePrice || 0),
      0,
    )

  const isSiteSale = (sale: (typeof sales)[number]) =>
    (sale.saleType || "client") === "site"

  const projectChemicalExpenses = sales
    .filter(isSiteSale)
    .reduce((total, sale) => total + getSaleAmount(sale), 0)

  const totalSales = sales
    .filter((sale) => {
      if (!isSiteSale(sale)) return true
      return (sale.paymentStatus || "Pending") === "Received"
    })
    .reduce((total, sale) => total + getSaleAmount(sale), 0)

  const profit = totalSales - totalPurchases
  const totalProducts = new Set(products.map((p) => p.name)).size
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.stockQuantity * p.unitPrice,
    0,
  )

  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const monthlySales = sales.filter((sale) => new Date(sale.saleDate) >= lastMonth)
  const monthlyPurchases = purchases.filter(
    (purchase) => new Date(purchase.purchaseDate) >= lastMonth,
  )

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const deadStockProducts = products.filter((p) => {
    const createdDate = new Date(p.createdAt)
    return p.stockQuantity > 0 && createdDate < ninetyDaysAgo
  })

  const productSalesMap = new Map<string, number>()
  sales.forEach((sale) => {
    sale.items?.forEach((item: any) => {
      const current = productSalesMap.get(item.productName) || 0
      productSalesMap.set(item.productName, current + (item.quantitySold || 0))
    })
  })
  const topSellingProducts = Array.from(productSalesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const OVERDUE_DAYS = 30
  const overdueDate = new Date()
  overdueDate.setDate(overdueDate.getDate() - OVERDUE_DAYS)

  const overdueClients = clients
    .map((client) => {
      const clientSales = sales.filter((s) => s.client === client.name)
      const total = clientSales.reduce(
        (sum, s) =>
          sum +
          (s.items || []).reduce(
            (iSum: number, item: any) =>
              iSum + (item.quantitySold || 0) * (item.salePrice || 0),
            0,
          ),
        0,
      )
      const lastSaleDate = clientSales.reduce((latest, s) => {
        const d = new Date(s.saleDate)
        return !latest || d > latest ? d : latest
      }, null as Date | null)
      return {
        name: client.name,
        total,
        isOverdue: Boolean(lastSaleDate && lastSaleDate < overdueDate),
      }
    })
    .filter((c) => c.isOverdue)
    .slice(0, 5)

  const overdueSuppliers = suppliers
    .map((supplier) => {
      const supplierPurchases = purchases.filter((p) => p.supplier === supplier.name)
      const total = supplierPurchases.reduce(
        (sum, p) =>
          sum +
          (p.items || []).reduce(
            (iSum: number, item: any) =>
              iSum + (item.quantityPurchased || 0) * (item.purchasePrice || 0),
            0,
          ),
        0,
      )
      const lastPurchaseDate = supplierPurchases.reduce((latest, p) => {
        const d = new Date(p.purchaseDate)
        return !latest || d > latest ? d : latest
      }, null as Date | null)
      return {
        name: supplier.name,
        total,
        isOverdue: Boolean(lastPurchaseDate && lastPurchaseDate < overdueDate),
      }
    })
    .filter((s) => s.isOverdue)
    .slice(0, 5)

  const recentSales = [...sales]
    .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
    .slice(0, 5)

  const recentPurchases = [...purchases]
    .sort(
      (a, b) =>
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
    )
    .slice(0, 5)

  const stockAttentionCount = lowStockProducts.length + deadStockProducts.length
  const highDeadStock = deadStockProducts.length > 10
  const highLowStock = lowStockProducts.length > 10
  const stockIconBlinkClass = highDeadStock
    ? "animate-dead-stock-icon-blink"
    : highLowStock
      ? "animate-low-stock-icon-blink"
      : undefined
  const stockIconTone = highDeadStock
    ? "danger"
    : highLowStock || stockAttentionCount > 0
      ? "alert"
      : "inventory"

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="section-title">Dashboard</h1>
        <p className="page-desc">What needs attention, and how the business is doing</p>
      </div>

      {/* KPIs — same card style; hover tone matches meaning */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Inventory value"
          value={formatRs(totalInventoryValue)}
          hint={`${totalProducts} products`}
          icon={Package}
          tone="inventory"
          onClick={() => go("products")}
        />
        <Kpi
          label="Total Sales"
          value={formatRs(totalSales)}
          hint={`${monthlySales.length} in last 30 days`}
          icon={TrendingUp}
          tone="sales"
          active
          onClick={() => go("sales")}
        />
        <Kpi
          label="Total Purchases"
          value={formatRs(totalPurchases)}
          hint={`${monthlyPurchases.length} in last 30 days`}
          icon={ShoppingCart}
          tone="purchases"
          active
          onClick={() => go("purchases")}
        />
        <Kpi
          label="Net Profit"
          value={formatRs(profit)}
          hint={profit >= 0 ? "Sales minus purchases" : "Currently at a loss"}
          icon={profit < 0 ? TrendingDown : TrendingUp}
          tone={profit < 0 ? "danger" : "profit"}
          active
        />
        <Kpi
          label="Stock alerts"
          value={stockAttentionCount}
          hint={
            stockAttentionCount > 0
              ? `${lowStockProducts.length} low · ${deadStockProducts.length} dead`
              : `${totalProducts} products OK`
          }
          icon={stockAttentionCount > 0 ? AlertTriangle : Package}
          tone={stockIconTone}
          active={stockAttentionCount > 0}
          iconWrapperClassName={stockIconBlinkClass}
          onClick={() => go("products")}
        />
        <Kpi
          label="Clients"
          value={clients.length}
          hint="Active accounts"
          icon={Users}
          tone="clients"
          onClick={() => go("clients")}
        />
        <Kpi
          label="Suppliers"
          value={suppliers.length}
          hint="Active vendors"
          icon={Truck}
          tone="suppliers"
          onClick={() => go("suppliers")}
        />
        <Kpi
          label="Site expenses"
          value={formatRs(projectChemicalExpenses)}
          hint="Project chemical sales"
          icon={Package}
          tone="expense"
        />
      </div>

      {/* Activity — 2 columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel tone="neutral" active>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <PanelIcon tone="sales" active>
                  <TrendingUp className="h-4 w-4" />
                </PanelIcon>
                Recent sales
              </CardTitle>
              <CardDescription>Latest transactions</CardDescription>
            </div>
            <ViewLink label="View all" tone="neutral" onClick={() => go("sales")} />
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
              <ul className="space-y-0.5">
                {recentSales.map((sale) => {
                  const amount = getSaleAmount(sale)
                  const itemCount = sale.items?.length || 0
                  return (
                    <li key={sale.id}>
                      <ListRow onClick={() => go("sales")}>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-navy">
                            {sale.client}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
                            {formatNepaliDateForTable(sale.saleDate)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-brand-dark dark:text-brand">
                          {formatRs(amount)}
                        </span>
                      </ListRow>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState message="No sales recorded yet" />
            )}
          </CardContent>
        </Panel>

        <Panel tone="neutral" active>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <PanelIcon tone="purchases" active>
                  <ShoppingCart className="h-4 w-4" />
                </PanelIcon>
                Recent purchases
              </CardTitle>
              <CardDescription>Latest orders</CardDescription>
            </div>
            <ViewLink label="View all" tone="neutral" onClick={() => go("purchases")} />
          </CardHeader>
          <CardContent>
            {recentPurchases.length > 0 ? (
              <ul className="space-y-0.5">
                {recentPurchases.map((purchase) => {
                  const amount = (purchase.items || []).reduce(
                    (sum, item) =>
                      sum + (item.quantityPurchased || 0) * (item.purchasePrice || 0),
                    0,
                  )
                  const itemCount = purchase.items?.length || 0
                  return (
                    <li key={purchase.id}>
                      <ListRow onClick={() => go("purchases")}>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-navy">
                            {purchase.supplier}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
                            {formatNepaliDateForTable(purchase.purchaseDate)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-brand-dark dark:text-brand">
                          {formatRs(amount)}
                        </span>
                      </ListRow>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState message="No purchases recorded yet" />
            )}
          </CardContent>
        </Panel>
      </div>

      {/* Attention — 2 columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel tone="neutral" active={stockAttentionCount > 0}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <PanelIcon
                  tone={
                    highDeadStock
                      ? "danger"
                      : highLowStock || stockAttentionCount > 0
                        ? "alert"
                        : "neutral"
                  }
                  active={stockAttentionCount > 0}
                  className={stockIconBlinkClass}
                >
                  <AlertTriangle className="h-4 w-4" />
                </PanelIcon>
                Needs attention
              </CardTitle>
              <CardDescription>
                {stockAttentionCount > 0
                  ? `${lowStockProducts.length} low stock · ${deadStockProducts.length} dead stock`
                  : "Stock looks healthy"}
              </CardDescription>
            </div>
            <ViewLink label="Products" tone="neutral" onClick={() => go("products")} />
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <ul className="space-y-0.5">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <li key={product.id}>
                    <ListRow onClick={() => go("products")}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">HS {product.hsCode}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-border bg-muted text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                      >
                        {product.stockQuantity} left
                      </Badge>
                    </ListRow>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <CheckCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm">No low-stock items</p>
              </div>
            )}
          </CardContent>
        </Panel>

        <Panel tone="neutral" active>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <PanelIcon tone="sales" active>
                  <Package className="h-4 w-4" />
                </PanelIcon>
                Top selling products
              </CardTitle>
              <CardDescription>By quantity sold</CardDescription>
            </div>
            <ViewLink label="Sales" tone="neutral" onClick={() => go("sales")} />
          </CardHeader>
          <CardContent>
            {topSellingProducts.length > 0 ? (
              <ol className="space-y-0.5">
                {topSellingProducts.map(([name, qty], index) => (
                  <li key={name}>
                    <ListRow onClick={() => go("sales")}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted font-sans text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-navy">
                        {name}
                      </p>
                      <span className="shrink-0 text-sm font-medium tabular-nums text-brand-dark dark:text-brand">
                        {qty} sold
                      </span>
                    </ListRow>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState message="No sales data yet" />
            )}
          </CardContent>
        </Panel>
      </div>

      {/* Money due — 2 columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel tone="neutral" active={overdueClients.length > 0}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <PanelIcon tone={overdueClients.length > 0 ? "danger" : "neutral"} active={overdueClients.length > 0}>
                  <AlertTriangle className="h-4 w-4" />
                </PanelIcon>
                Client receivables
              </CardTitle>
              <CardDescription>Pending over {OVERDUE_DAYS} days</CardDescription>
            </div>
            <ViewLink label="Clients" tone="neutral" onClick={() => go("clients")} />
          </CardHeader>
          <CardContent>
            {overdueClients.length > 0 ? (
              <ul className="space-y-0.5">
                {overdueClients.map((c) => (
                  <li key={c.name}>
                    <ListRow onClick={() => go("clients")}>
                      <p className="truncate text-sm font-medium text-navy">
                        {c.name}
                      </p>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-navy">
                        {formatRs(c.total)}
                      </span>
                    </ListRow>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="No overdue receivables" />
            )}
          </CardContent>
        </Panel>

        <Panel tone="neutral" active={overdueSuppliers.length > 0}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <PanelIcon tone={overdueSuppliers.length > 0 ? "purchases" : "neutral"} active={overdueSuppliers.length > 0}>
                  <Truck className="h-4 w-4" />
                </PanelIcon>
                Supplier payables
              </CardTitle>
              <CardDescription>Pending over {OVERDUE_DAYS} days</CardDescription>
            </div>
            <ViewLink label="Suppliers" tone="neutral" onClick={() => go("suppliers")} />
          </CardHeader>
          <CardContent>
            {overdueSuppliers.length > 0 ? (
              <ul className="space-y-0.5">
                {overdueSuppliers.map((s) => (
                  <li key={s.name}>
                    <ListRow onClick={() => go("suppliers")}>
                      <p className="truncate text-sm font-medium text-navy">
                        {s.name}
                      </p>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                        {formatRs(s.total)}
                      </span>
                    </ListRow>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="No overdue payables" />
            )}
          </CardContent>
        </Panel>
      </div>
    </div>
  )
}
