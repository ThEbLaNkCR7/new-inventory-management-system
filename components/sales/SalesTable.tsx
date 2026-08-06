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
import { formatNepaliDateForTable, toTitleCase } from "@/lib/utils";
import {
  filterSelectClass,
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
import { Building2, ChevronDown, ChevronRight, Edit, Eye, Filter, Search, Trash2, TrendingUp, Users, X } from "lucide-react";
import React from "react";
import DataPagination from "@/components/ui/data-pagination";
import { formatSaleTotal, getSaleTotal } from "./utils";

type SaleGroup = {
  client: string;
  sales: any[];
};

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
  saleTypeFilter: "all" | "client" | "site";
  onSaleTypeFilterChange: (value: "all" | "client" | "site") => void;
  paymentStatusFilter: "all" | "Pending" | "Received";
  onPaymentStatusFilterChange: (value: "all" | "Pending" | "Received") => void;
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
  saleTypeFilter,
  onSaleTypeFilterChange,
  paymentStatusFilter,
  onPaymentStatusFilterChange,
  onView,
  onEdit,
  onDelete,
  onProductClick: _onProductClick,
  onClientClick: _onClientClick,
}: SalesTableProps) {
  const [expandedClients, setExpandedClients] = React.useState<Set<string>>(
    new Set(),
  );

  const tabSales = React.useMemo(() => {
    if (activeTab === "individual") {
      return filteredSales.filter((s) => s.clientType === "Individual");
    }

    if (activeTab === "company") {
      return filteredSales.filter((s) => s.clientType === "Company");
    }

    return filteredSales;
  }, [filteredSales, activeTab]);

  const groupedSales = React.useMemo(() => {
    const groups = new Map<string, any[]>();

    tabSales.forEach((sale) => {
      const clientKey = sale.client || "Unknown";
      const existing = groups.get(clientKey) || [];
      existing.push(sale);
      groups.set(clientKey, existing);
    });

    return Array.from(groups.entries()).map(([client, sales]) => ({
      client,
      sales,
    })) as SaleGroup[];
  }, [tabSales]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    saleTypeFilter !== "all" ||
    paymentStatusFilter !== "all";

  const clearFilters = () => {
    onSearchTermChange("");
    onSaleTypeFilterChange("all");
    onPaymentStatusFilterChange("all");
  };

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
  } = usePagination(groupedSales, {
    resetKey: `${searchTerm}|${activeTab}|${saleTypeFilter}|${paymentStatusFilter}`,
  });

  const saleTypeBadge = (saleType?: string) => (
    <Badge variant="outline" className="font-normal">
      {saleType === "site" ? "Site" : "Client"}
    </Badge>
  );

  const paymentStatusBadge = (paymentStatus?: string) => {
    const status = paymentStatus || "Pending";
    const isReceived = status === "Received";
    return (
      <Badge
        variant="secondary"
        className="border border-border bg-card text-navy"
      >
        {status}
      </Badge>
    );
  };

  const toggleExpanded = (client: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(client)) next.delete(client);
      else next.add(client);
      return next;
    });
  };

  const renderSaleActions = (sale: any) => (
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant="neutralOutline"
        onClick={(e) => {
          e.stopPropagation();
          onView(sale);
        }}
        className="text-muted-foreground hover:bg-muted hover:border-navy/30 hover:text-navy dark:hover:bg-muted dark:hover:border-white/30 transition-colors"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="neutralOutline"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(sale);
        }}
        className="hover:bg-muted dark:hover:bg-muted transition-colors"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="neutralOutline"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(sale);
        }}
        className="text-navy transition-colors hover:bg-muted hover:border-border"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  // Fixed expand slot so single-sale rows align with grouped rows
  const renderExpandCell = (content?: React.ReactNode) => (
    <TableCell className="w-10 min-w-10 max-w-10 p-2 align-middle">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center">
        {content}
      </div>
    </TableCell>
  );

  const renderSaleDetailRow = (sale: any) => (
    <TableRow
      key={sale.id}
      className="hover:bg-muted/60 transition-colors duration-150"
    >
      {renderExpandCell()}
      <TableCell className="pl-6 text-sm font-medium text-navy">
        {sale.saleType === "site" && sale.projectName
          ? sale.projectName
          : "Client sale"}
      </TableCell>
      <TableCell>{saleTypeBadge(sale.saleType)}</TableCell>
      <TableCell>{paymentStatusBadge(sale.paymentStatus)}</TableCell>
      <TableCell className="text-sm font-medium tabular-nums text-navy">
        {sale.items?.length || 0}
      </TableCell>
      <TableCell className="text-sm font-medium tabular-nums text-navy">
        Rs {formatSaleTotal(sale)}
      </TableCell>
      <TableCell className="text-sm font-medium text-navy">
        {formatNepaliDateForTable(sale.saleDate)}
      </TableCell>
      <TableCell>{renderSaleActions(sale)}</TableCell>
    </TableRow>
  );

  const renderSaleRows = () =>
    paginatedGroups.flatMap((group) => {
      // Single sale — full detail row (same columns as image)
      if (group.sales.length === 1) {
        const sale = group.sales[0];
        return [
          <TableRow
            key={group.client}
            className="hover:bg-muted/60 transition-colors duration-150"
          >
            {renderExpandCell()}
            <TableCell className="text-sm font-medium text-navy">
              {toTitleCase(group.client)}
            </TableCell>
            <TableCell>{saleTypeBadge(sale.saleType)}</TableCell>
            <TableCell>{paymentStatusBadge(sale.paymentStatus)}</TableCell>
            <TableCell className="text-sm font-medium tabular-nums text-navy">
              {sale.items?.length || 0}
            </TableCell>
            <TableCell className="text-sm font-medium tabular-nums text-navy">
              Rs {formatSaleTotal(sale)}
            </TableCell>
            <TableCell className="text-sm font-medium text-navy">
              {formatNepaliDateForTable(sale.saleDate)}
            </TableCell>
            <TableCell>{renderSaleActions(sale)}</TableCell>
          </TableRow>,
        ];
      }

      const isExpanded = expandedClients.has(group.client);
      const groupTotal = group.sales.reduce(
        (sum, sale) => sum + getSaleTotal(sale),
        0,
      );
      const headerRow = (
        <TableRow
          key={`group-${group.client}`}
          className="bg-muted/20 hover:bg-muted/50 dark:hover:bg-muted/60 cursor-pointer transition-colors duration-150"
          onClick={() => toggleExpanded(group.client)}
        >
          {renderExpandCell(
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-navy hover:bg-muted hover:text-navy"
              aria-label={isExpanded ? "Collapse sales" : "Expand sales"}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(group.client);
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
                {toTitleCase(group.client)}
              </p>
              <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                {group.sales.length}{" "}
                {group.sales.length === 1 ? "sale" : "sales"}
              </p>
            </div>
          </TableCell>
          <TableCell />
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

      return [headerRow, ...group.sales.map((sale) => renderSaleDetailRow(sale))];
    });

  const tableHeader = (
    <TableHeader>
      <TableRow className={tableHeadRowClass}>
        <TableHead className="w-10 min-w-10 max-w-10 p-2" />
        <TableHead>Client</TableHead>
        <TableHead>Sale Type</TableHead>
        <TableHead>Payment Status</TableHead>
        <TableHead>Items</TableHead>
        <TableHead>Total</TableHead>
        <TableHead>Date</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>Sales Transactions</CardTitle>
        <CardDescription>
          Track all sales transactions and revenue by client type
        </CardDescription>

        <div className={pageToolbarClass}>
          <div className={searchWrapClass}>
            <Search className={searchIconClass} />
            <Input
              placeholder="Search by client, product, or invoice..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className={searchInputClass}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={saleTypeFilter}
              onValueChange={(value: "all" | "client" | "site") =>
                onSaleTypeFilterChange(value)
              }
            >
              <SelectTrigger className={filterSelectClass}>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Sale type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="site">Site</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={paymentStatusFilter}
              onValueChange={(value: "all" | "Pending" | "Received") =>
                onPaymentStatusFilterChange(value)
              }
            >
              <SelectTrigger className="h-10 w-full border-border bg-background sm:w-44">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Payment status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="neutralOutline"
                size="sm"
                onClick={clearFilters}
                className="h-10 shrink-0 gap-1.5"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
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
              <span>All Sales</span>
              <Badge variant="secondary" className={tabsCountBadgeClass}>
                {salesCounts.allCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="individual" className={tabsTriggerClass}>
              <Users className="h-4 w-4" />
              <span>Individual</span>
              <Badge variant="secondary" className={tabsCountBadgeClass}>
                {salesCounts.individualCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="company" className={tabsTriggerClass}>
              <Building2 className="h-4 w-4" />
              <span>Company</span>
              <Badge variant="secondary" className={tabsCountBadgeClass}>
                {salesCounts.companyCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="all"
            className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            <div className="overflow-x-auto">
              <Table>
                {tableHeader}
                <TableBody>{renderSaleRows()}</TableBody>
              </Table>
              {groupedSales.length === 0 && (
                <div className="text-center py-8 animate-in fade-in-0 duration-300">
                  <p className="text-sm font-normal italic text-muted-foreground">No sales found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="individual"
            className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            <div className="overflow-x-auto">
              <Table>
                {tableHeader}
                <TableBody>{renderSaleRows()}</TableBody>
              </Table>
              {groupedSales.length === 0 && (
                <div className="text-center py-8 animate-in fade-in-0 duration-300">
                  <p className="text-sm font-normal italic text-muted-foreground">No individual sales found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="company"
            className="space-y-4 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            <div className="overflow-x-auto">
              <Table>
                {tableHeader}
                <TableBody>{renderSaleRows()}</TableBody>
              </Table>
              {groupedSales.length === 0 && (
                <div className="text-center py-8 animate-in fade-in-0 duration-300">
                  <p className="text-sm font-normal italic text-muted-foreground">No company sales found</p>
                </div>
              )}
            </div>
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
