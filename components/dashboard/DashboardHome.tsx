"use client"

import { useInventory } from "@/contexts/InventoryContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingCart, TrendingUp, AlertTriangle, DollarSign, Users, Truck, Calendar, BarChart3, Clock, CheckCircle, XCircle } from "lucide-react"
import { formatNepaliDateForTable } from "@/lib/utils"

export default function DashboardHome() {
  const {
    products,
    purchases,
    sales,
    clients,
    suppliers,
    getLowStockProducts,
    getTotalSales,
    getTotalPurchases,
    getProfit,
  } = useInventory()

  const lowStockProducts = getLowStockProducts()
  const totalSales = getTotalSales()
  const totalPurchases = getTotalPurchases()
  const profit = getProfit()

  // Calculate additional metrics
  const totalProducts = new Set(products.map(p => p.name)).size
  const totalClients = clients.length
  const totalSuppliers = suppliers.length
  const averageProductPrice = totalProducts > 0 ? products.reduce((sum, p) => sum + p.unitPrice, 0) / totalProducts : 0
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stockQuantity * p.unitPrice), 0)

  // Recent activity (last 30 days)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const monthlySales = sales.filter(
    (sale) => new Date(sale.saleDate) >= lastMonth
  );

  const monthlyPurchases = purchases.filter(
    (purchase) => new Date(purchase.purchaseDate) >= lastMonth
  );
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const deadStockProducts = products.filter((p) => {
    const createdDate = new Date(p.createdAt);
    return p.stockQuantity > 0 && createdDate < ninetyDaysAgo;
  });

  const productSalesMap = new Map<string, number>();

  sales.forEach((sale) => {
    sale.items?.forEach((item: any) => {
      const current = productSalesMap.get(item.productName) || 0;
      productSalesMap.set(
        item.productName,
        current + (item.quantitySold || 0),
      );
    });
  });

  const topSellingProducts = Array.from(productSalesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);


  const OVERDUE_DAYS = 30;

  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - OVERDUE_DAYS);

  // CLIENT OVERDUE (receivables)
  const clientReceivables = clients.map((client) => {
    const clientSales = sales.filter((s) => s.client === client.name);

    const total = clientSales.reduce(
      (sum, s) =>
        sum +
        (s.items || []).reduce(
          (iSum: number, item: any) =>
            iSum +
            (item.quantitySold || 0) * (item.salePrice || 0),
          0,
        ),
      0,
    );

    const lastSaleDate = clientSales.reduce((latest, s) => {
      const d = new Date(s.saleDate);
      return !latest || d > latest ? d : latest;
    }, null as Date | null);

    const isOverdue =
      lastSaleDate && lastSaleDate < overdueDate;

    return {
      name: client.name,
      total,
      isOverdue,
    };
  });

  // SUPPLIER OVERDUE (payables)
  const supplierPayables = suppliers.map((supplier) => {
    const supplierPurchases = purchases.filter(
      (p) => p.supplier === supplier.name,
    );

    const total = supplierPurchases.reduce(
      (sum, p) =>
        sum +
        (p.items || []).reduce(
          (iSum: number, item: any) =>
            iSum +
            (item.quantityPurchased || 0) *
            (item.purchasePrice || 0),
          0,
        ),
      0,
    );

    const lastPurchaseDate = supplierPurchases.reduce(
      (latest, p) => {
        const d = new Date(p.purchaseDate);
        return !latest || d > latest ? d : latest;
      },
      null as Date | null,
    );

    const isOverdue =
      lastPurchaseDate && lastPurchaseDate < overdueDate;

    return {
      name: supplier.name,
      total,
      isOverdue,
    };
  });

  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      color: "text-gray-800 dark:text-gray-100",
      bgColor: "bg-white dark:bg-gray-800",
      description: "Items in inventory",
    },
    {
      title: "Total Sales",
      value: `Rs ${totalSales.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-gray-800 dark:text-gray-100",
      bgColor: "bg-white dark:bg-gray-800",
      description: "All time revenue",
    },
    {
      title: "Total Purchases",
      value: `Rs ${totalPurchases.toLocaleString()}`,
      icon: ShoppingCart,
      color: "text-gray-800 dark:text-gray-100",
      bgColor: "bg-white dark:bg-gray-800",
      description: "Total spending",
    },
    {
      title: "Net Profit",
      value: `Rs ${profit.toLocaleString()}`,
      icon: DollarSign,
      color: profit >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor: "bg-white dark:bg-gray-800",
      description: profit >= 0 ? "Positive balance" : "Negative balance",
    },
    {
      title: "Inventory Value",
      value: `Rs ${totalInventoryValue.toLocaleString()}`,
      icon: BarChart3,
      color: "text-gray-800 dark:text-gray-100",
      bgColor: "bg-white dark:bg-gray-800",
      description: "Current stock value",
    },
    {
      title: "Active Clients",
      value: totalClients,
      icon: Users,
      color: "text-gray-800 dark:text-gray-100",
      bgColor: "bg-white dark:bg-gray-800",
      description: "Registered clients",
    },
  ]

  const quickStats = [
    {
      title: "Active Suppliers",
      value: totalSuppliers,
      icon: Truck,
      color: "text-gray-700 dark:text-gray-200",
    },
    {
      title: "Avg. Product Price",
      value: `Rs ${averageProductPrice.toFixed(2)}`,
      icon: DollarSign,
      color: "text-gray-700 dark:text-gray-200",
    },
    {
      title: "Low Stock Items",
      value: lowStockProducts.length,
      icon: AlertTriangle,
      color: "text-amber-600",
    },
    {
      title: "This Monthly Sales",
      value: monthlySales.length,
      icon: Calendar,
      color: "text-gray-700 dark:text-gray-200",
    },
    {
      title: "Dead Stock",
      value: deadStockProducts.length,
      icon: Clock,
      color: "text-red-600",
    }
  ]

  return (
    <div className="space-y-8 p-6 min-h-screen transition-colors duration-300 bg-white dark:bg-gray-900">
      <div className="space-y-2">
        <h1 className="section-title">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">Comprehensive overview of your inventory management system</p>
      </div>

      {/* Inventory Section */}
      <div className="space-y-4 mt-10">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-2 mb-6 tracking-tight pl-4 border-l-4 border-blue-500 bg-blue-50/60 dark:bg-blue-900/20">Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Total Products */}
          {stats.filter(s => s.title === "Total Products").map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-200">{stat.title}</CardTitle>
                  <div className={`p-3 rounded-full ${stat.bgColor} shadow-md transition-all duration-300 hover:scale-110`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
          {/* Inventory Value */}
          {stats.filter(s => s.title === "Inventory Value").map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-200">{stat.title}</CardTitle>
                  <div className={`p-3 rounded-full ${stat.bgColor} shadow-md transition-all duration-300 hover:scale-110`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
          {/* Low Stock Items (from quickStats) */}
          {quickStats.filter(q => q.title === "Low Stock Items").map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm hover:scale-105">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {quickStats.filter(q => q.title === "Dead Stock").map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm hover:scale-105">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* most frequently sales */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-green-600 mb-4">
            Top Selling Products
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topSellingProducts.map(([name, qty], idx) => (
              <Card key={idx}>
                <CardContent className="p-4 flex justify-between">
                  <p className="font-medium">{name}</p>
                  <Badge className="bg-green-100 text-green-700">
                    {qty} sold
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Sales & Purchases Section */}
      <div className="space-y-4 mt-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-2 mb-6 tracking-tight pl-4 border-l-4 border-green-500 bg-green-50/60 dark:bg-green-900/20">Sales & Purchases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Total Sales */}
          {stats.filter(s => s.title === "Total Sales").map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-200">{stat.title}</CardTitle>
                  <div className={`p-3 rounded-full ${stat.bgColor} shadow-md transition-all duration-300 hover:scale-110`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
          {/* Total Purchases */}
          {stats.filter(s => s.title === "Total Purchases").map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-200">{stat.title}</CardTitle>
                  <div className={`p-3 rounded-full ${stat.bgColor} shadow-md transition-all duration-300 hover:scale-110`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
          {/* Net Profit */}
          {stats.filter(s => s.title === "Net Profit").map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-200">{stat.title}</CardTitle>
                  <div className={`p-3 rounded-full ${stat.bgColor} shadow-md transition-all duration-300 hover:scale-110`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
          {/* This Monthly Sales (from quickStats) */}
          {quickStats.filter(q => q.title === "This Monthly Sales").map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm hover:scale-105">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Business Associate Section */}
      <div className="space-y-4 mt-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-2 mb-6 tracking-tight pl-4 border-l-4 border-indigo-500 bg-indigo-50/60 dark:bg-indigo-900/20">Business Associate</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Active Clients */}
          {stats.filter(s => s.title === "Active Clients").map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-200">{stat.title}</CardTitle>
                  <div className={`p-3 rounded-full ${stat.bgColor} shadow-md transition-all duration-300 hover:scale-110`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
          {/* Suppliers (from quickStats) */}
          {quickStats.filter(q => q.title === "Active Suppliers").map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm hover:scale-105">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {/* Avg. Product Price (from quickStats) */}
          {quickStats.filter(q => q.title === "Avg. Product Price").map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm hover:scale-105">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* CLIENT OVERDUE RECEIVABLES */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Client Receivables (Overdue)
              </CardTitle>
              <CardDescription>
                Payments pending over {OVERDUE_DAYS} days
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {clientReceivables
                  .filter((c) => c.isOverdue)
                  .slice(0, 5)
                  .map((c, i) => (
                    <div
                      key={i}
                      className="flex justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200"
                    >
                      <p className="font-medium">{c.name}</p>
                      <p className="text-red-600 font-semibold">
                        Rs {c.total.toLocaleString()}
                      </p>
                    </div>
                  ))}

                {clientReceivables.filter((c) => c.isOverdue).length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No overdue receivables 🎉
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SUPPLIER OVERDUE PAYABLES */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-gray-800 dark:border-gray-700 backdrop-blur-sm hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600">
                <Truck className="mr-2 h-5 w-5" />
                Supplier Payables (Overdue)
              </CardTitle>
              <CardDescription>
                Payments pending over {OVERDUE_DAYS} days
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {supplierPayables
                  .filter((s) => s.isOverdue)
                  .slice(0, 5)
                  .map((s, i) => (
                    <div
                      key={i}
                      className="flex justify-between p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200"
                    >
                      <p className="font-medium">{s.name}</p>
                      <p className="text-orange-600 font-semibold">
                        Rs {s.total.toLocaleString()}
                      </p>
                    </div>
                  ))}

                {supplierPayables.filter((s) => s.isOverdue).length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No overdue payables 🎉
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alert */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-gray-200">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              Stock Alerts
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {lowStockProducts.length > 0 ? `${lowStockProducts.length} items need attention` : "All items well stocked"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{product.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">HS Code: {product.hsCode}</p>
                    </div>
                    <Badge variant="destructive" className="bg-amber-500 text-white">
                      {product.stockQuantity} left
                    </Badge>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    +{lowStockProducts.length - 5} more items
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">All products are well stocked</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-200">Recent Sales</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const saleItems: any[] = []
                sales.forEach((s) => {
                  if (s.items && s.items.length > 0) {
                    s.items.forEach((item: any) => {
                      saleItems.push({
                        ...item,
                        client: s.client,
                        saleDate: s.saleDate,
                        id: s.id,
                      })
                    })
                  }
                })
                return saleItems.slice(-5).reverse().map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{item.productName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        Rs {((item.quantitySold || 0) * (item.salePrice || 0)).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatNepaliDateForTable(item.saleDate)}
                      </p>
                    </div>
                  </div>
                ))
              })()}
              {sales.length === 0 && (
                <div className="text-center py-6">
                  <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No sales recorded yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Purchases */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-200">Recent Purchases</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Latest orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const purchaseItems: any[] = []
                purchases.forEach((p) => {
                  if (p.items && p.items.length > 0) {
                    p.items.forEach((item: any) => {
                      purchaseItems.push({
                        ...item,
                        supplier: p.supplier,
                        purchaseDate: p.purchaseDate,
                        id: p.id,
                      })
                    })
                  }
                })
                return purchaseItems.slice(-5).reverse().map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{item.productName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.supplier}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">
                        Rs {((item.quantityPurchased || 0) * (item.purchasePrice || 0)).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatNepaliDateForTable(item.purchaseDate)}
                      </p>
                    </div>
                  </div>
                ))
              })()}
              {purchases.length === 0 && (
                <div className="text-center py-6">
                  <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No purchases recorded yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-200">This Week's Performance</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Sales and purchase activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-gray-900 dark:text-gray-200">Sales</span>
                </div>
                <span className="font-semibold text-green-600">{monthlySales.length} transactions</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <div className="flex items-center">
                  <ShoppingCart className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-gray-900 dark:text-gray-200">Purchases</span>
                </div>
                <span className="font-semibold text-blue-600">{monthlyPurchases.length} orders</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-200">System Status</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Current system overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Database Status</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Last Backup</span>
                <span className="text-gray-900 dark:text-gray-200">Today</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Active Users</span>
                <span className="text-gray-900 dark:text-gray-200">1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">System Version</span>
                <span className="text-gray-900 dark:text-gray-200">v1.0.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
