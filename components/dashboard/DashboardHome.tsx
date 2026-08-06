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
  Clock,
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
type Tone = "sales" | "purchases" | "profit" | "alert" | "clients" | "suppliers" | "inventory" | "expense" | "danger"

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
    sales: plain,
    purchases: plain,
    profit: plain,
    alert: plain,
    clients: plain,
    suppliers: plain,
    inventory: plain,
    expense: plain,
    danger: plain,
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
}: {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: Tone
  /** Show tone color at rest (alerts, loss, etc.) */
  active?: boolean
  onClick?: () => void
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
          "absolute inset-y-0 left-0 w-1 transition-colors",
          active ? t.bar : cn("bg-transparent", t.barHover),
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
            active ? t.iconActive : cn(t.iconRest, t.iconHover),
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
          "absolute inset-x-0 top-0 h-0.5 transition-colors",
          active ? t.bar : cn("bg-transparent", t.panelBarHover),
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
}: {
  tone?: Tone
  active?: boolean
  children: ReactNode
}) {
  const t = toneStyles[tone]
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        active ? t.iconActive : cn(t.iconRest, t.panelIconHover),
      )}
    >
      {children}
    </span>
  )
}

function ListRow({
  children,
  onClick,
}: {
  children: ReactNode
  onClick?: () => void
}) {
  const Comp = onClick ? "button" : "li"
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group -mx-2 flex w-full items-center justify-between gap-3 rounded-md px-2 py-2.5 text-left transition-colors duration-150",
        "hover:bg-muted/60",
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
        "inline-flex items-center gap-1 font-sans text-xs font-medium text-muted-foreground transition-colors",
        t.linkHover,
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
        "shrink-0 font-sans text-sm font-medium tabular-nums transition-colors text-navy",
        t.amountHover,
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
          tone={stockAttentionCount > 0 ? "alert" : "inventory"}
          active={stockAttentionCount > 0}
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
        <Panel tone="sales" active>
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
            <ViewLink label="View all" tone="sales" onClick={() => go("sales")} />
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

        <Panel tone="purchases">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <PanelIcon tone="purchases">
                  <ShoppingCart className="h-4 w-4" />
                </PanelIcon>
                Recent purchases
              </CardTitle>
              <CardDescription>Latest orders</CardDescription>
            </div>
            <ViewLink label="View all" tone="purchases" onClick={() => go("purchases")} />
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
                        <Amount tone="purchases" className="text-sm font-semibold">
                          {formatRs(amount)}
                        </Amount>
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
        <Panel tone="alert" active={stockAttentionCount > 0}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <PanelIcon tone="alert" active={stockAttentionCount > 0}>
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
            <ViewLink label="Products" tone="alert" onClick={() => go("products")} />
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
            {deadStockProducts.length > 0 && (
              <button
                type="button"
                onClick={() => go("products")}
                className="mt-3 flex w-full items-center gap-2 rounded-md border border-red-100 bg-red-50/70 px-3 py-2 text-left text-xs text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:bg-red-900/15 dark:text-red-300 dark:hover:bg-red-900/25"
              >
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {deadStockProducts.length} dead stock item
                {deadStockProducts.length === 1 ? "" : "s"} (90+ days)
              </button>
            )}
          </CardContent>
        </Panel>

        <Panel tone="sales" active>
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
            <ViewLink label="Sales" tone="sales" onClick={() => go("sales")} />
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
        <Panel tone="danger" active={overdueClients.length > 0}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <PanelIcon tone="danger" active={overdueClients.length > 0}>
                  <AlertTriangle className="h-4 w-4" />
                </PanelIcon>
                Client receivables
              </CardTitle>
              <CardDescription>Pending over {OVERDUE_DAYS} days</CardDescription>
            </div>
            <ViewLink label="Clients" tone="danger" onClick={() => go("clients")} />
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

        <Panel tone="alert" active={overdueSuppliers.length > 0}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <PanelIcon tone="alert" active={overdueSuppliers.length > 0}>
                  <Truck className="h-4 w-4" />
                </PanelIcon>
                Supplier payables
              </CardTitle>
              <CardDescription>Pending over {OVERDUE_DAYS} days</CardDescription>
            </div>
            <ViewLink label="Suppliers" tone="alert" onClick={() => go("suppliers")} />
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
