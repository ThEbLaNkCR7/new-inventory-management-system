"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useInventory } from "@/contexts/InventoryContext"
import { DollarSign, Info, Package, Printer, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react"
import {
 Bar,
 CartesianGrid,
 Cell,
 Legend,
 Line,
 LineChart,
 BarChart as RechartsBarChart,
 ResponsiveContainer,
 Tooltip,
 XAxis,
 YAxis
} from "recharts"

// Simple, neutral colors for better readability
const CHART_COLORS = {
 sales: "#3B82F6", // Blue
 purchases: "#10B981", // Green
 profit: "#8B5CF6", // Purple
 neutral: "#6B7280", // Gray
}

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
 <Card className="border border-border">
 <CardContent className="p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm font-medium text-muted-foreground">{title}</p>
 <p className="text-2xl font-semibold tracking-tight tabular-nums text-navy">Rs {value.toLocaleString()}</p>
 {trend && (
 <div className="flex items-center mt-2">
 {trend === "up" ? (
 <TrendingUp className="h-4 w-4 text-navy mr-1" />
 ) : (
 <TrendingDown className="h-4 w-4 text-navy mr-1" />
 )}
 <span className={`text-sm ${trend === "up" ? "text-navy" : "text-navy"}`}>
 {trendValue}% from last month
 </span>
 </div>
 )}
 </div>
 <div className={`p-3 rounded-full ${color || "bg-foreground"}`}>
 <Icon className="h-6 w-6 text-background" />
 </div>
 </div>
 </CardContent>
 </Card>
)

const SimpleTooltip = ({ active, payload, label }: any) => {
 if (active && payload && payload.length) {
 return (
 <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
 <p className="font-semibold text-navy mb-2">{label}</p>
 {payload.map((entry: any, index: number) => (
 <div key={index} className="flex items-center gap-2 mb-1">
 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
 <span className="text-sm text-muted-foreground">
 {entry.name}: <span className="font-semibold">Rs {entry.value.toLocaleString()}</span>
 </span>
 </div>
 ))}
 </div>
 )
 }
 return null
}

export default function VisualReports() {
 const { products, sales, purchases, getTotalSales, getTotalPurchases, getProfit } = useInventory()

 const totalSales = getTotalSales()
 const totalPurchases = getTotalPurchases()
 const totalProfit = getProfit()
 const totalProducts = products.length

 // Simple monthly data for trends (using Nepali months)
 const monthlyData = [
 { month: "Baisakh", sales: 45000, purchases: 32000, profit: 13000 },
 { month: "Jestha", sales: 52000, purchases: 38000, profit: 14000 },
 { month: "Asar", sales: 48000, purchases: 35000, profit: 13000 },
 { month: "Shrawan", sales: 61000, purchases: 42000, profit: 19000 },
 { month: "Bhadra", sales: 55000, purchases: 40000, profit: 15000 },
 { month: "Ashoj", sales: 67000, purchases: 45000, profit: 22000 },
 ]

 // Simple category breakdown
 const categoryBreakdown = products.reduce((acc, product) => {
 const category = product.category || "Uncategorized"
 if (!acc[category]) {
 acc[category] = { name: category, value: 0, count: 0 }
 }
 acc[category].value += product.stockQuantity * product.unitPrice
 acc[category].count += product.stockQuantity
 return acc
 }, {} as Record<string, { name: string; value: number; count: number }>)

 const categoryData = Object.values(categoryBreakdown)
 .map((item, index) => ({
 ...item,
 fill: Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length],
 percentage: ((item.value / Object.values(categoryBreakdown).reduce((sum, cat) => sum + cat.value, 0)) * 100).toFixed(1),
 }))
 .sort((a, b) => b.value - a.value)

 // Top 5 products by value
 const topProducts = products
 .map((product) => ({
 name: product.name.length > 15 ? product.name.substring(0, 15) + "..." : product.name,
 value: product.stockQuantity * product.unitPrice,
 stock: product.stockQuantity,
 }))
 .sort((a, b) => b.value - a.value)
 .slice(0, 5)

 return (
 <div className="report-print-root space-y-4 min-h-screen transition-colors duration-300">
 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
 <div className="space-y-2">
 <h1 className="section-title">
 Visual Reports
 </h1>
 <p className="page-desc">Easy-to-understand charts and insights</p>
 </div>
 <Button
 type="button"
 variant="outline"
 className="print:hidden shrink-0"
 onClick={() => window.print()}
 >
 <Printer className="h-4 w-4 mr-2" />
 Print
 </Button>
 </div>

 {/* Key Numbers */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <StatCard
 title="Total Sales"
 value={totalSales}
 icon={DollarSign}
 trend="up"
 trendValue="12.5"
 color="bg-foreground"
 />
 <StatCard
 title="Total Purchases"
 value={totalPurchases}
 icon={ShoppingCart}
 trend="up"
 trendValue="8.2"
 color="bg-foreground"
 />
 <StatCard
 title="Net Profit"
 value={totalProfit}
 icon={TrendingUp}
 trend="up"
 trendValue="15.3"
 color="bg-foreground"
 />
 <StatCard
 title="Total Products"
 value={totalProducts}
 icon={Package}
 trend="up"
 trendValue="5.1"
 color="bg-foreground"
 />
 </div>

 {/* Monthly Trends - Simple Line Chart */}
 <Card className="border border-border">
 <CardHeader>
 <div className="flex items-center justify-between">
 <div>
 <CardTitle>
 Monthly Trends
 </CardTitle>
 <CardDescription className="text-sm text-muted-foreground">
 How sales, purchases, and profit changed over 6 months
 </CardDescription>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <ResponsiveContainer width="100%" height={300}>
 <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
 <XAxis 
 dataKey="month" 
 tick={{ fontSize: 12, fill: '#6b7280' }}
 axisLine={{ stroke: '#e5e7eb' }}
 />
 <YAxis 
 tickFormatter={(value) => `Rs ${(value / 1000).toFixed(0)}K`} 
 tick={{ fontSize: 12, fill: '#6b7280' }}
 axisLine={{ stroke: '#e5e7eb' }}
 />
 <Tooltip content={<SimpleTooltip />} />
 <Legend />
 <Line 
 type="monotone" 
 dataKey="sales" 
 stroke={CHART_COLORS.sales} 
 strokeWidth={3}
 name="Sales"
 dot={{ fill: CHART_COLORS.sales, strokeWidth: 2, r: 4 }}
 />
 <Line 
 type="monotone" 
 dataKey="purchases" 
 stroke={CHART_COLORS.purchases} 
 strokeWidth={3}
 name="Purchases"
 dot={{ fill: CHART_COLORS.purchases, strokeWidth: 2, r: 4 }}
 />
 <Line 
 type="monotone" 
 dataKey="profit" 
 stroke={CHART_COLORS.profit} 
 strokeWidth={3}
 name="Profit"
 dot={{ fill: CHART_COLORS.profit, strokeWidth: 2, r: 4 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>

 {/* Two Column Layout */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {/* Category Breakdown - Simple Bar Chart */}
 <Card className="border border-border">
 <CardHeader>
 <CardTitle>
 Inventory by Category
 </CardTitle>
 <CardDescription className="text-sm text-muted-foreground">
 Total value of products in each category
 </CardDescription>
 </CardHeader>
 <CardContent>
 <ResponsiveContainer width="100%" height={300}>
 <RechartsBarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
 <XAxis 
 dataKey="name" 
 tick={{ fontSize: 11, fill: '#6b7280' }}
 axisLine={{ stroke: '#e5e7eb' }}
 />
 <YAxis 
 tickFormatter={(value) => `Rs ${(value / 1000).toFixed(0)}K`} 
 tick={{ fontSize: 11, fill: '#6b7280' }}
 axisLine={{ stroke: '#e5e7eb' }}
 />
 <Tooltip 
 formatter={(value: any) => [`Rs ${value.toLocaleString()}`, "Value"]}
 labelFormatter={(label) => `Category: ${label}`}
 />
 <Bar dataKey="value" radius={[4, 4, 0, 0]}>
 {categoryData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.fill} />
 ))}
 </Bar>
 </RechartsBarChart>
 </ResponsiveContainer>
 
 {/* Category Summary */}
 <div className="mt-4 p-3 bg-muted rounded-lg">
 <div className="flex items-center gap-2 mb-2">
 <Info className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm font-medium text-navy">Summary</span>
 </div>
 <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
 {categoryData.slice(0, 4).map((category, index) => (
 <div key={index} className="flex justify-between">
 <span>{category.name}:</span>
 <span className="font-medium">{category.percentage}%</span>
 </div>
 ))}
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Top Products - Simple Bar Chart */}
 <Card className="border border-border">
 <CardHeader>
 <CardTitle>
 Top Products by Value
 </CardTitle>
 <CardDescription className="text-sm text-muted-foreground">
 Products with highest inventory value
 </CardDescription>
 </CardHeader>
 <CardContent>
 <ResponsiveContainer width="100%" height={300}>
 <RechartsBarChart data={topProducts} layout="horizontal" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
 <XAxis
 type="number"
 tickFormatter={(value) => `Rs ${(value / 1000).toFixed(0)}K`}
 tick={{ fontSize: 11, fill: '#6b7280' }}
 axisLine={{ stroke: '#e5e7eb' }}
 />
 <YAxis 
 dataKey="name" 
 type="category" 
 width={90} 
 tick={{ fontSize: 11, fill: '#6b7280' }}
 axisLine={{ stroke: '#e5e7eb' }}
 />
 <Tooltip
 formatter={(value: any) => [`Rs ${value.toLocaleString()}`, "Value"]}
 labelFormatter={(label) => `Product: ${label}`}
 />
 <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={CHART_COLORS.neutral} />
 </RechartsBarChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>
 </div>

 {/* Simple Summary Card */}
 <Card className="border border-border">
 <CardHeader>
 <CardTitle>
 Quick Insights
 </CardTitle>
 <CardDescription className="text-sm text-muted-foreground">
 Key takeaways from your data
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="p-4 bg-muted dark:bg-muted rounded-lg border border-border dark:border-border">
 <div className="flex items-center gap-2 mb-2">
 <TrendingUp className="h-4 w-4 text-navy" />
 <span className="font-medium text-navy dark:text-navy">Best Month</span>
 </div>
 <p className="text-sm text-navy dark:text-navy">
 June had the highest sales at Rs 67,000
 </p>
 </div>
 
 <div className="p-4 bg-muted dark:bg-muted rounded-lg border border-border dark:border-border">
 <div className="flex items-center gap-2 mb-2">
 <Package className="h-4 w-4 text-navy" />
 <span className="font-medium text-navy">Inventory</span>
 </div>
 <p className="text-sm text-navy dark:text-navy">
 {categoryData.length} categories with {totalProducts} products
 </p>
 </div>
 
 <div className="p-4 bg-muted dark:bg-muted rounded-lg border border-border dark:border-border">
 <div className="flex items-center gap-2 mb-2">
 <DollarSign className="h-4 w-4 text-navy" />
 <span className="font-medium text-navy dark:text-navy">Profit Margin</span>
 </div>
 <p className="text-sm text-navy dark:text-navy">
 {totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0}% average profit margin
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 )
}
