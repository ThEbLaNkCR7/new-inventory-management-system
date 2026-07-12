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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Purchase } from "@/contexts/InventoryContext";
import { formatNepaliDateForTable } from "@/lib/utils";
import { Building2, Edit, Eye, Trash2, TrendingUp, Users } from "lucide-react";
import React from "react";
import { formatPurchaseTotal } from "./utils";

interface PurchasesTableProps {
  filteredPurchases: Purchase[];
  activeTab: string;
  onActiveTabChange: (value: string) => void;
  purchasesCounts: {
    allCount: number;
    individualCount: number;
    companyCount: number;
  };
  onView: (purchase: Purchase) => void;
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchase: Purchase) => void;
  onSupplierClick: (supplier: string) => void;
}

export default function PurchasesTable({
  filteredPurchases,
  activeTab,
  onActiveTabChange,
  purchasesCounts,
  onView,
  onEdit,
  onDelete,
  onSupplierClick,
}: PurchasesTableProps) {
  const tabPurchases = React.useMemo(() => {
    if (activeTab === "individual") {
      return filteredPurchases.filter(
        (p) => p.supplierType === "Individual",
      );
    }

    if (activeTab === "company") {
      return filteredPurchases.filter((p) => p.supplierType === "Company");
    }

    return filteredPurchases;
  }, [filteredPurchases, activeTab]);

  const renderTable = (
    showSupplierType: boolean,
    emptyMessage: string,
  ) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-700">
            <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
              Items
            </TableHead>
            <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
              Supplier
            </TableHead>
            <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
              Quantity
            </TableHead>
            <TableHead className="font-semibold text-lg text-gray-700 dark:text-gray-300">
              Unit Price
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
          {tabPurchases.map((purchase) => (
            <TableRow
              key={purchase.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
            >
              <TableCell className="font-medium">
                {purchase.items?.length || 0}
              </TableCell>
              <TableCell className="font-medium">
                <span
                  className="text-gray-700 dark:text-gray-100 cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  onClick={() => onSupplierClick(purchase.supplier)}
                >
                  {purchase.supplier}
                </span>
              </TableCell>
              <TableCell className="font-medium">
                {purchase.items?.reduce(
                  (total: number, item: any) => total + (item.quantityPurchased || 0),
                  0
                ) || 0}
              </TableCell>
              <TableCell className="text-gray-700">
                Rs{" "}
                {(
                  (purchase.items?.[0]?.purchasePrice || 0)
                ).toFixed(2)}
              </TableCell>
              <TableCell className="text-gray-700">
                Rs {formatPurchaseTotal(purchase)}
              </TableCell>
              <TableCell className="text-gray-700">
                {formatNepaliDateForTable(purchase.purchaseDate)}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="neutralOutline"
                    onClick={() => onView(purchase)}
                    className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-600 text-blue-600 dark:text-blue-400 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="neutralOutline"
                    onClick={() => onEdit(purchase)}
                    className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="neutralOutline"
                    onClick={() => onDelete(purchase)}
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
      {tabPurchases.length === 0 && (
        <div className="text-center py-8 animate-in fade-in-0 duration-300">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle>Purchase Orders</CardTitle>
        <CardDescription>
          Track all purchase orders and inventory restocking by supplier type
        </CardDescription>
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
              <span>All Purchases</span>
              <Badge
                variant="secondary"
                className="ml-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-xs px-1.5 py-0.5"
              >
                {purchasesCounts.allCount}
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
                {purchasesCounts.individualCount}
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
                {purchasesCounts.companyCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="all"
            className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            {renderTable(true, "No purchases found")}
          </TabsContent>

          <TabsContent
            value="individual"
            className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            {renderTable(false, "No individual purchases found")}
          </TabsContent>

          <TabsContent
            value="company"
            className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            {renderTable(false, "No company purchases found")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}