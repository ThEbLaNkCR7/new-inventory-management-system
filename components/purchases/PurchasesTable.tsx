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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatNepaliDateForTable, toTitleCase } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";
import { Building2, Edit, Eye, Search, Trash2, TrendingUp, Users, X } from "lucide-react";
import React from "react";
import DataPagination from "@/components/ui/data-pagination";
import { formatPurchaseTotal, getPurchaseTotal } from "./utils";

type PurchaseGroup = {
  supplier: string;
  purchases: Purchase[];
};

interface PurchasesTableProps {
  filteredPurchases: Purchase[];
  activeTab: string;
  onActiveTabChange: (value: string) => void;
  purchasesCounts: {
    allCount: number;
    individualCount: number;
    companyCount: number;
  };
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
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
  searchTerm,
  onSearchTermChange,
  onView,
  onEdit,
  onDelete,
  onSupplierClick: _onSupplierClick,
}: PurchasesTableProps) {
  const [selectedPurchases, setSelectedPurchases] = React.useState<
    Record<string, string>
  >({});

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

  const groupedPurchases = React.useMemo(() => {
    const groups = new Map<string, Purchase[]>();

    tabPurchases.forEach((purchase) => {
      const supplierKey = purchase.supplier || "Unknown";
      const existing = groups.get(supplierKey) || [];
      existing.push(purchase);
      groups.set(supplierKey, existing);
    });

    return Array.from(groups.entries()).map(([supplier, purchases]) => ({
      supplier,
      purchases,
    })) as PurchaseGroup[];
  }, [tabPurchases]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedGroups,
    startItem,
    endItem,
  } = usePagination(groupedPurchases, {
    resetKey: `${searchTerm}|${activeTab}`,
  });

  const formatPurchaseOptionLabel = (purchase: Purchase) => {
    const date = formatNepaliDateForTable(purchase.purchaseDate);
    const total = formatPurchaseTotal(purchase);
    const items = purchase.items?.length || 0;
    return `${date} · ${items} items · Rs ${total}`;
  };

  const getSelectedPurchase = (group: PurchaseGroup) => {
    const selectedId = selectedPurchases[group.supplier] || group.purchases[0]?.id;
    return (
      group.purchases.find((purchase) => purchase.id === selectedId) ||
      group.purchases[0]
    );
  };

  const renderTable = (emptyMessage: string) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-700">
            <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Items
            </TableHead>
            <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Supplier
            </TableHead>
            <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Quantity
            </TableHead>
            <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Unit Price
            </TableHead>
            <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Total
            </TableHead>
            <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Date
            </TableHead>
            <TableHead className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedGroups.map((group) => {
            const selectedPurchase = getSelectedPurchase(group);
            if (!selectedPurchase) return null;

            const quantity =
              selectedPurchase.items?.reduce(
                (total, item) => total + (item.quantityPurchased || 0),
                0,
              ) || 0;

            return (
              <TableRow
                key={group.supplier}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
              >
                <TableCell className="font-medium">
                  {selectedPurchase.items?.length || 0}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="space-y-2 min-w-[180px]">
                    <span className="text-gray-700 dark:text-gray-100">
                      {toTitleCase(group.supplier)}
                    </span>
                    {group.purchases.length > 1 ? (
                      <Select
                        value={selectedPurchase.id}
                        onValueChange={(value) =>
                          setSelectedPurchases((prev) => ({
                            ...prev,
                            [group.supplier]: value,
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 w-full text-xs border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200">
                          <SelectValue placeholder="Select purchase">
                            {formatPurchaseOptionLabel(selectedPurchase)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          {group.purchases.map((purchase) => (
                            <SelectItem key={purchase.id} value={purchase.id}>
                              {formatPurchaseOptionLabel(purchase)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                    {group.purchases.length > 1 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {group.purchases.length} purchases · Total Rs{" "}
                        {group.purchases
                          .reduce(
                            (sum, purchase) => sum + getPurchaseTotal(purchase),
                            0,
                          )
                          .toLocaleString()}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{quantity}</TableCell>
                <TableCell className="text-gray-700">
                  Rs {(selectedPurchase.items?.[0]?.purchasePrice || 0).toFixed(2)}
                </TableCell>
                <TableCell className="text-gray-700">
                  Rs {formatPurchaseTotal(selectedPurchase)}
                </TableCell>
                <TableCell className="text-gray-700">
                  {formatNepaliDateForTable(selectedPurchase.purchaseDate)}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="neutralOutline"
                      onClick={() => onView(selectedPurchase)}
                      className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-600 text-blue-600 dark:text-blue-400 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="neutralOutline"
                      onClick={() => onEdit(selectedPurchase)}
                      className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="neutralOutline"
                      onClick={() => onDelete(selectedPurchase)}
                      className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-600 text-red-600 dark:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {groupedPurchases.length === 0 && (
        <div className="text-center py-8 animate-in fade-in-0 duration-300">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Purchase Orders
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
          Track all purchase orders and inventory restocking by supplier type
        </CardDescription>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search by supplier, product, or invoice..."
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
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg h-11">
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
            {renderTable("No purchases found")}
          </TabsContent>

          <TabsContent
            value="individual"
            className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            {renderTable("No individual purchases found")}
          </TabsContent>

          <TabsContent
            value="company"
            className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            {renderTable("No company purchases found")}
          </TabsContent>
        </Tabs>
        <DataPagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          startItem={startItem}
          endItem={endItem}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </CardContent>
    </Card>
  );
}
