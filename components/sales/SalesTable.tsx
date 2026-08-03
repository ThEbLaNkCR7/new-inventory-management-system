"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNepaliDateForTable, toTitleCase } from "@/lib/utils";
import { Building2, Edit, Eye, Search, Trash2, TrendingUp, Users, X } from "lucide-react";
import React from "react";
import { formatSaleTotal } from "./utils";

interface SalesTableProps {
  filteredSales: any[];
  activeTab: string;
  onActiveTabChange: (value: string) => void;
  salesCounts: {
    allCount: number;
    individualCount: number;
    companyCount: number;
  };
  products: any[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onView: (sale: any) => void;
  onEdit: (sale: any) => void;
  onDelete: (sale: any) => void;
  onProductClick: (product: any) => void;
  onClientClick: (client: string) => void;
}

export default function SalesTable({
  filteredSales,
  activeTab,
  onActiveTabChange,
  salesCounts,
  products,
  searchTerm,
  onSearchTermChange,
  onView,
  onEdit,
  onDelete,
  onProductClick,
  onClientClick,
}: SalesTableProps) {
  const tabSales = React.useMemo(() => {
    if (activeTab === "individual") {
      return filteredSales.filter((s) => s.clientType === "Individual");
    }

    if (activeTab === "company") {
      return filteredSales.filter((s) => s.clientType === "Company");
    }

    return filteredSales;
  }, [filteredSales, activeTab]);

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Sales Transactions
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
          Track all sales transactions and revenue by client type
        </CardDescription>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search by client, product, or invoice..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="h-10 pl-10 border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200 focus:border-slate-400"
            />
          </div>
          {searchTerm.trim() !== "" && (
            <Button
              type="button"
              variant="neutralOutline"
              size="sm"
              onClick={() => onSearchTermChange("")}
              className="h-10 shrink-0 gap-1.5 text-gray-600 dark:text-gray-300"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={onActiveTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl h-14">
            <TabsTrigger
              value="all"
              className="flex items-center justify-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-semibold transition-all duration-300 ease-in-out rounded-lg px-3 py-2.5 h-full"
            >
              <TrendingUp className="h-4 w-4" />
              <span>All Sales</span>
              <Badge
                variant="secondary"
                className="ml-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-xs px-1.5 py-0.5"
              >
                {salesCounts.allCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="individual"
              className="flex items-center justify-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 data-[state=active]:font-semibold transition-all duration-300 ease-in-out rounded-lg px-3 py-2.5 h-full"
            >
              <Users className="h-4 w-4" />
              <span>Individual</span>
              <Badge
                variant="secondary"
                className="ml-1 bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 text-xs px-1.5 py-0.5"
              >
                {salesCounts.individualCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="company"
              className="flex items-center justify-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 data-[state=active]:font-semibold transition-all duration-300 ease-in-out rounded-lg px-3 py-2.5 h-full"
            >
              <Building2 className="h-4 w-4" />
              <span>Company</span>
              <Badge
                variant="secondary"
                className="ml-1 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 text-xs px-1.5 py-0.5"
              >
                {salesCounts.companyCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* all */}
          <TabsContent
            value="all"
            className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700">
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Items
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Client
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Quantity
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Total
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Date
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabSales.map((sale) => (
                    <TableRow
                      key={sale.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      <TableCell className="font-medium">
                        {sale.items?.length || 0}
                      </TableCell>
                      <TableCell className="font-medium">
                        <span
                          className="text-gray-700 dark:text-gray-100 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                          onClick={() => {
                            onClientClick(sale.client);
                          }}
                        >
                          {toTitleCase(sale.client)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.items?.reduce(
                          (total: number, item: any) => total + (item.quantitySold || 0),
                          0
                        ) || 0}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        Rs {formatSaleTotal(sale)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {formatNepaliDateForTable(sale.saleDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="neutralOutline"
                            onClick={() => onView(sale)}
                            className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-600 text-blue-600 dark:text-blue-400 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="neutralOutline"
                            onClick={() => onEdit(sale)}
                            className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="neutralOutline"
                            onClick={() => onDelete(sale)}
                            className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-600 text-red-600 dark:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {tabSales.length === 0 && (
                <div className="text-center py-8 animate-in fade-in-0 duration-300">
                  <p className="text-gray-500">No sales found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* individual */}
          <TabsContent
            value="individual"
            className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Items
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Client
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Quantity
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Total
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Date
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabSales.map((sale) => (
                    <TableRow
                      key={sale.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      <TableCell className="font-medium">
                        {sale.items?.length || 0}
                      </TableCell>
                      <TableCell className="font-medium">
                        <span
                          className="text-gray-700 dark:text-gray-100 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                          onClick={() => {
                            onClientClick(sale.client);
                          }}
                        >
                          {toTitleCase(sale.client)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.items?.reduce(
                          (total: number, item: any) => total + (item.quantitySold || 0),
                          0
                        ) || 0}
                      </TableCell>
                      <TableCell>
                        Rs {formatSaleTotal(sale)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {formatNepaliDateForTable(sale.saleDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="neutralOutline"
                            onClick={() => onView(sale)}
                            className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-600 text-blue-600 dark:text-blue-400 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="neutralOutline"
                            onClick={() => onEdit(sale)}
                            className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="neutralOutline"
                            onClick={() => onDelete(sale)}
                            className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-600 text-red-600 dark:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {tabSales.length === 0 && (
                <div className="text-center py-8 animate-in fade-in-0 duration-300">
                  <p className="text-gray-500">No individual sales found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* company */}
          <TabsContent
            value="company"
            className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700">
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Items
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Client
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Quantity
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Total
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Date
                    </TableHead>
                    <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabSales.map((sale) => (
                    <TableRow
                      key={sale.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      <TableCell className="font-medium">
                        {sale.items?.length || 0}
                      </TableCell>
                      <TableCell className="font-medium">
                        <span
                          className="text-gray-700 dark:text-gray-100 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                          onClick={() => {
                            onClientClick(sale.client);
                          }}
                        >
                          {toTitleCase(sale.client)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.items?.reduce(
                          (total: number, item: any) => total + (item.quantitySold || 0),
                          0
                        ) || 0}
                      </TableCell>
                      <TableCell>
                        Rs {formatSaleTotal(sale)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {formatNepaliDateForTable(sale.saleDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="neutralOutline"
                            onClick={() => onView(sale)}
                            className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-600 text-blue-600 dark:text-blue-400 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="neutralOutline"
                            onClick={() => onEdit(sale)}
                            className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="neutralOutline"
                            onClick={() => onDelete(sale)}
                            className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-600 text-red-600 dark:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {tabSales.length === 0 && (
                <div className="text-center py-8 animate-in fade-in-0 duration-300">
                  <p className="text-gray-500">No company sales found</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
