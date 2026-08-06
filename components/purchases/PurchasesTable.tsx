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
import type { Purchase } from "@/contexts/InventoryContext";
import { formatNepaliDateForTable, toTitleCase } from "@/lib/utils";
import {
  pageToolbarClass,
  searchIconClass,
  searchInputClass,
  searchWrapClass,
  tableHeadRowClass,
  tabsCountBadgeClass,
  tabsListClass,
  tabsTriggerClass,
} from "@/lib/ui-styles";
import { usePagination } from "@/hooks/usePagination";
import { Building2, ChevronDown, ChevronRight, Edit, Eye, Search, Trash2, TrendingUp, Users, X } from "lucide-react";
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
  const [expandedSuppliers, setExpandedSuppliers] = React.useState<Set<string>>(
    new Set(),
  );

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

  const toggleExpanded = (supplier: string) => {
    setExpandedSuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(supplier)) next.delete(supplier);
      else next.add(supplier);
      return next;
    });
  };

  const renderPurchaseActions = (purchase: Purchase) => (
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant="neutralOutline"
        onClick={() => onView(purchase)}
        className="text-muted-foreground hover:bg-muted hover:border-navy/30 hover:text-navy dark:hover:bg-muted dark:hover:border-white/30 transition-colors"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="neutralOutline"
        onClick={() => onEdit(purchase)}
        className="hover:bg-muted dark:hover:bg-muted transition-colors"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="neutralOutline"
        onClick={() => onDelete(purchase)}
        className="text-navy transition-colors hover:bg-muted hover:border-border"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const expandCellClass = "w-10 min-w-10 max-w-10 p-2 align-middle";

  const renderExpandCell = (content?: React.ReactNode) => (
    <TableCell className={expandCellClass}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center">
        {content}
      </div>
    </TableCell>
  );

  const renderPurchaseDetailRow = (purchase: Purchase) => (
    <TableRow
      key={purchase.id}
      className="hover:bg-muted/60 transition-colors duration-150"
    >
      {renderExpandCell()}
      <TableCell className="pl-6 text-sm font-medium text-navy">
        Purchase order
      </TableCell>
      <TableCell className="text-sm font-medium tabular-nums text-navy">
        {purchase.items?.length || 0}
      </TableCell>
      <TableCell className="text-sm font-medium tabular-nums text-navy">
        Rs {(purchase.items?.[0]?.purchasePrice || 0).toFixed(2)}
      </TableCell>
      <TableCell className="text-sm font-medium tabular-nums text-navy">
        Rs {formatPurchaseTotal(purchase)}
      </TableCell>
      <TableCell className="text-sm font-medium text-navy">
        {formatNepaliDateForTable(purchase.purchaseDate)}
      </TableCell>
      <TableCell>{renderPurchaseActions(purchase)}</TableCell>
    </TableRow>
  );

  const renderPurchaseRows = () =>
    paginatedGroups.flatMap((group) => {
      if (group.purchases.length === 1) {
        const purchase = group.purchases[0];
        return [
          <TableRow
            key={group.supplier}
            className="hover:bg-muted/60 transition-colors duration-150"
          >
            {renderExpandCell()}
            <TableCell className="text-sm font-medium text-navy">
              {toTitleCase(group.supplier)}
            </TableCell>
            <TableCell className="text-sm font-medium tabular-nums text-navy">
              {purchase.items?.length || 0}
            </TableCell>
            <TableCell className="text-sm font-medium tabular-nums text-navy">
              Rs {(purchase.items?.[0]?.purchasePrice || 0).toFixed(2)}
            </TableCell>
            <TableCell className="text-sm font-medium tabular-nums text-navy">
              Rs {formatPurchaseTotal(purchase)}
            </TableCell>
            <TableCell className="text-sm font-medium text-navy">
              {formatNepaliDateForTable(purchase.purchaseDate)}
            </TableCell>
            <TableCell>{renderPurchaseActions(purchase)}</TableCell>
          </TableRow>,
        ];
      }

      const isExpanded = expandedSuppliers.has(group.supplier);
      const groupTotal = group.purchases.reduce(
        (sum, purchase) => sum + getPurchaseTotal(purchase),
        0,
      );

      const headerRow = (
        <TableRow
          key={`group-${group.supplier}`}
          className="bg-muted/20 hover:bg-muted/50 dark:hover:bg-muted/60 cursor-pointer transition-colors duration-150"
          onClick={() => toggleExpanded(group.supplier)}
        >
          {renderExpandCell(
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-navy hover:bg-muted hover:text-navy"
              aria-label={isExpanded ? "Collapse purchases" : "Expand purchases"}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(group.supplier);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>,
          )}
          <TableCell>
            <div className="min-w-[140px]">
              <p className="text-sm font-medium text-navy">
                {toTitleCase(group.supplier)}
              </p>
              <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                {group.purchases.length}{" "}
                {group.purchases.length === 1 ? "purchase" : "purchases"}
              </p>
            </div>
          </TableCell>
          <TableCell />
          <TableCell />
          <TableCell className="text-sm font-medium tabular-nums text-navy">
            Rs {groupTotal.toLocaleString()}
          </TableCell>
          <TableCell />
          <TableCell />
        </TableRow>
      );

      if (!isExpanded) return [headerRow];

      return [headerRow, ...group.purchases.map(renderPurchaseDetailRow)];
    });

  const renderTable = (emptyMessage: string) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className={tableHeadRowClass}>
            <TableHead className="w-10 min-w-10 max-w-10 p-2" />
            <TableHead>Supplier</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{renderPurchaseRows()}</TableBody>
      </Table>
      {groupedPurchases.length === 0 && (
        <div className="text-center py-8 animate-in fade-in-0 duration-300">
          <p className="text-sm font-normal italic text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>Purchase Orders</CardTitle>
        <CardDescription>
          Track all purchase orders and inventory restocking by supplier type
        </CardDescription>

        <div className={pageToolbarClass}>
          <div className={searchWrapClass}>
            <Search className={searchIconClass} />
            <Input
              placeholder="Search by supplier, product, or invoice..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className={searchInputClass}
            />
          </div>
          {searchTerm.trim() !== "" && (
            <Button
              type="button"
              variant="neutralOutline"
              size="sm"
              onClick={() => onSearchTermChange("")}
              className="h-10 shrink-0 gap-1.5"
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
          <TabsList className={tabsListClass}>
            <TabsTrigger value="all" className={tabsTriggerClass}>
              <TrendingUp className="h-4 w-4" />
              <span>All Purchases</span>
              <Badge variant="secondary" className={tabsCountBadgeClass}>
                {purchasesCounts.allCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="individual" className={tabsTriggerClass}>
              <Users className="h-4 w-4" />
              <span>Individual</span>
              <Badge variant="secondary" className={tabsCountBadgeClass}>
                {purchasesCounts.individualCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="company" className={tabsTriggerClass}>
              <Building2 className="h-4 w-4" />
              <span>Company</span>
              <Badge variant="secondary" className={tabsCountBadgeClass}>
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
