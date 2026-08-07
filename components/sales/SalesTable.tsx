"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { cn, formatNepaliDateForTable, toTitleCase } from "@/lib/utils";
import {
  filterSelectClass,
  pageToolbarClass,
  searchIconClass,
  searchInputClass,
  searchWrapClass,
  tabsCountBadgeClass,
  tabsListClass,
  tabsTriggerClass,
} from "@/lib/ui-styles";
import { usePagination } from "@/hooks/usePagination";
import { Building2, ChevronDown, ChevronRight, Edit, Eye, Filter, Search, Trash2, TrendingUp, Users, X } from "lucide-react";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import DataPagination from "@/components/ui/data-pagination";
import { formatSaleTotal, getSaleTotal, printSaleExactView } from "./utils";

type SaleGroup = {
  client: string;
  sales: any[];
};

export type SalesTableHandle = {
  print: () => void;
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

const headCellClass = "h-14 text-base font-semibold text-navy";

function formatSaleProductNames(sale: any): string {
  const names = (sale.items || [])
    .map((item: any) => item.productName)
    .filter(Boolean)
    .map((name: string) => toTitleCase(name));
  if (names.length === 0) {
    return sale.productName ? toTitleCase(sale.productName) : "—";
  }
  return names.join(", ");
}

function getSaleItemCount(sale: any) {
  return sale.items?.length || (sale.productName ? 1 : 0);
}

function renderItemsCell(sale: any) {
  const names = formatSaleProductNames(sale);
  return (
    <div className="min-w-0 max-w-[7.5rem] overflow-hidden sm:max-w-[11rem] lg:max-w-none lg:min-w-[12rem]">
      <p
        className="whitespace-normal break-words text-sm font-normal leading-snug text-navy"
        title={names !== "—" ? names : undefined}
      >
        {names}
      </p>
    </div>
  );
}

const SalesTable = forwardRef<SalesTableHandle, SalesTableProps>(
  function SalesTable(
    {
      filteredSales,
      activeTab,
      onActiveTabChange,
      salesCounts,
      products: _products,
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
    },
    ref,
  ) {
  const printRootRef = useRef<HTMLDivElement>(null);
  const printRestoreRef = useRef<{
    expanded: Set<string>;
    page: number;
    pageSize: number;
  } | null>(null);
  const printStartedRef = useRef(false);
  const [awaitingPrint, setAwaitingPrint] = useState(false);

  const [expandedClients, setExpandedClients] = useState<Set<string>>(
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

    return Array.from(groups.entries())
      .map(([client, sales]) => ({
        client,
        sales: [...sales].sort(
          (a, b) =>
            new Date(b.saleDate || 0).getTime() -
            new Date(a.saleDate || 0).getTime(),
        ),
      }))
      .sort((a, b) => {
        const aLatest = new Date(a.sales[0]?.saleDate || 0).getTime()
        const bLatest = new Date(b.sales[0]?.saleDate || 0).getTime()
        return bLatest - aLatest
      }) as SaleGroup[];
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

  useImperativeHandle(ref, () => ({
    print: () => {
      printRestoreRef.current = {
        expanded: new Set(expandedClients),
        page,
        pageSize,
      };
      printStartedRef.current = false;
      setExpandedClients(
        new Set(groupedSales.map((group) => group.client)),
      );
      setPageSize(Math.max(groupedSales.length, 1));
      setPage(1);
      setAwaitingPrint(true);
    },
  }));

  useEffect(() => {
    if (!awaitingPrint) {
      printStartedRef.current = false;
      return;
    }
    if (printStartedRef.current) return;

    const allExpanded = groupedSales.every(
      (group) =>
        group.sales.length === 1 || expandedClients.has(group.client),
    );
    const showingAll = pageSize >= groupedSales.length && page === 1;
    if (!allExpanded || !showingAll) return;

    printStartedRef.current = true;
    const timer = window.setTimeout(() => {
      if (!printRootRef.current) {
        setAwaitingPrint(false);
        return;
      }
      printSaleExactView(printRootRef.current, {
        wide: true,
        tableVariant: "sales",
        onAfterPrint: () => {
          const prev = printRestoreRef.current;
          if (prev) {
            setExpandedClients(prev.expanded);
            setPage(prev.page);
            setPageSize(prev.pageSize);
          }
          printRestoreRef.current = null;
          setAwaitingPrint(false);
        },
      });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [
    awaitingPrint,
    expandedClients,
    groupedSales,
    page,
    pageSize,
    setPage,
    setPageSize,
  ]);

  const paymentStatusBadge = (paymentStatus?: string) => {
    const status = paymentStatus || "Pending";
    const isReceived = status === "Received";
    return (
      <Badge
        variant="secondary"
        className={cn(
          "border font-normal",
          isReceived
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
        )}
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
    <div className="flex items-center space-x-2 print:hidden" data-print-hide>
      <Button
        size="sm"
        variant="neutralOutline"
        title="View"
        onClick={(e) => {
          e.stopPropagation();
          onView(sale);
        }}
        className="text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="neutralOutline"
        title="Edit"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(sale);
        }}
        className="text-muted-foreground transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:hover:border-amber-500 dark:hover:bg-amber-900/20 dark:hover:text-amber-300"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="neutralOutline"
        title="Delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(sale);
        }}
        className="text-muted-foreground transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  // Fixed expand slot — pl-6 aligns chevron with search icon
  const renderExpandCell = (content?: React.ReactNode) => (
    <TableCell
      className="w-10 min-w-10 max-w-10 py-2 pl-6 pr-2 align-middle print:hidden"
      data-print-hide
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center">
        {content}
      </div>
    </TableCell>
  );

  const renderSaleDetailRow = (sale: any) => {
    const itemCount = getSaleItemCount(sale);
    return (
    <TableRow
      key={sale.id}
      className="bg-white transition-colors duration-150 hover:bg-muted/40 dark:bg-card"
    >
      {renderExpandCell()}
      <TableCell>
        <div className="min-w-[100px]">
          {sale.saleType === "site" && sale.projectName ? (
            <p className="text-sm font-normal text-navy">
              Material for : {sale.projectName}
            </p>
          ) : (
            <p className="text-sm font-normal text-navy">Client sale</p>
          )}
          <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
      </TableCell>
      <TableCell>{paymentStatusBadge(sale.paymentStatus)}</TableCell>
      <TableCell className="min-w-0 max-w-[7.5rem] sm:max-w-[11rem] lg:max-w-none">
        {renderItemsCell(sale)}
      </TableCell>
      <TableCell className="text-sm font-normal text-navy">
        {formatNepaliDateForTable(sale.saleDate)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right text-sm font-semibold tabular-nums text-navy">
        Rs {formatSaleTotal(sale)}
      </TableCell>
      <TableCell className="print:hidden" data-print-hide>
        {renderSaleActions(sale)}
      </TableCell>
    </TableRow>
    );
  };

  const renderSaleRows = () =>
    paginatedGroups.flatMap((group) => {
      if (group.sales.length === 1) {
        const sale = group.sales[0];
        const itemCount = getSaleItemCount(sale);
        return [
          <TableRow
            key={group.client}
            className="bg-white transition-colors duration-150 hover:bg-muted/40 dark:bg-card"
          >
            {renderExpandCell()}
            <TableCell>
              <div className="min-w-[100px]">
                <p className="text-sm font-semibold text-navy">
                  {toTitleCase(group.client)}
                </p>
                <p className="mt-0.5 text-[11px] font-normal tabular-nums text-muted-foreground">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
            </TableCell>
            <TableCell>{paymentStatusBadge(sale.paymentStatus)}</TableCell>
            <TableCell className="min-w-0 max-w-[7.5rem] sm:max-w-[11rem] lg:max-w-none">
              {renderItemsCell(sale)}
            </TableCell>
            <TableCell className="text-sm font-normal text-navy">
              {formatNepaliDateForTable(sale.saleDate)}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right text-sm font-semibold tabular-nums text-navy">
              Rs {formatSaleTotal(sale)}
            </TableCell>
            <TableCell className="print:hidden" data-print-hide>
              {renderSaleActions(sale)}
            </TableCell>
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
          className="cursor-pointer bg-white transition-colors duration-150 hover:bg-muted/40 dark:bg-card dark:hover:bg-muted/60"
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
              <p className="text-sm font-semibold text-navy">
                {toTitleCase(group.client)}
              </p>
              <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                {group.sales.length}{" "}
                {group.sales.length === 1 ? "sale" : "sales"}
              </p>
            </div>
          </TableCell>
          <TableCell />
          <TableCell className="min-w-0 max-w-[7.5rem] sm:max-w-[11rem] lg:max-w-none" />
          <TableCell />
          <TableCell className="whitespace-nowrap text-right text-sm font-semibold tabular-nums text-navy">
            Rs {groupTotal.toLocaleString()}
          </TableCell>
          <TableCell className="print:hidden" data-print-hide />
        </TableRow>
      );

      if (!isExpanded) return [headerRow];

      return [headerRow, ...group.sales.map((sale) => renderSaleDetailRow(sale))];
    });

  const tableHeader = (
    <TableHeader>
      <TableRow className="border-0">
        <TableHead
          className="h-14 w-10 min-w-10 max-w-10 py-2 pl-6 pr-2 print:hidden"
          data-print-hide
        />
        <TableHead className={headCellClass}>Client</TableHead>
        <TableHead className={headCellClass}>Payment Status</TableHead>
        <TableHead className={headCellClass}>Items</TableHead>
        <TableHead className={headCellClass}>Date</TableHead>
        <TableHead className={cn(headCellClass, "text-right")}>Total</TableHead>
        <TableHead className={cn(headCellClass, "print:hidden")} data-print-hide>
          Actions
        </TableHead>
      </TableRow>
    </TableHeader>
  );

  const emptyState = (message: string) => (
    <div className="py-8 text-center animate-in fade-in-0 duration-300">
      <p className="text-sm font-normal italic text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <Card className="overflow-hidden border border-border bg-card shadow-sm">
      <div ref={printRootRef} className="sales-table-print-root">
      <CardHeader className="px-3 pb-3 pt-5">
        <CardTitle className="pl-3 font-semibold text-navy">
          Sales Transactions
          <span className="ml-1.5 text-sm font-semibold text-navy">
            ({tabSales.length})
          </span>
        </CardTitle>

        <div className={cn(pageToolbarClass, "print:hidden")} data-print-hide>
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
              <SelectContent className="bg-white dark:bg-card">
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
              <SelectTrigger className="h-10 w-full border-border bg-white dark:bg-card sm:w-44">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Payment status" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-card">
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
                className="h-10 shrink-0 gap-1.5 border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs
          value={activeTab}
          onValueChange={onActiveTabChange}
          className="w-full"
        >
          <div className="px-3 pb-3 print:hidden" data-print-hide>
            <TabsList className={cn(tabsListClass, "mb-0")}>
              <TabsTrigger
                value="all"
                className={cn(
                  tabsTriggerClass,
                  "data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none",
                )}
              >
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span>All Sales</span>
                <span className={tabsCountBadgeClass(activeTab === "all")}>
                  ({salesCounts.allCount})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="individual"
                className={cn(
                  tabsTriggerClass,
                  "data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none",
                )}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>Individual</span>
                <span className={tabsCountBadgeClass(activeTab === "individual")}>
                  ({salesCounts.individualCount})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="company"
                className={cn(
                  tabsTriggerClass,
                  "data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none",
                )}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span>Company</span>
                <span className={tabsCountBadgeClass(activeTab === "company")}>
                  ({salesCounts.companyCount})
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="all"
            className="mt-0 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            <div className="overflow-x-auto bg-white dark:bg-card">
              <Table>
                {tableHeader}
                <TableBody className="bg-white dark:bg-card">
                  {renderSaleRows()}
                </TableBody>
              </Table>
              {groupedSales.length === 0 && emptyState("No sales found")}
            </div>
          </TabsContent>

          <TabsContent
            value="individual"
            className="mt-0 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            <div className="overflow-x-auto bg-white dark:bg-card">
              <Table>
                {tableHeader}
                <TableBody className="bg-white dark:bg-card">
                  {renderSaleRows()}
                </TableBody>
              </Table>
              {groupedSales.length === 0 && emptyState("No individual sales found")}
            </div>
          </TabsContent>

          <TabsContent
            value="company"
            className="mt-0 animate-in fade-in-0 slide-in-from-left-2 duration-300"
          >
            <div className="overflow-x-auto bg-white dark:bg-card">
              <Table>
                {tableHeader}
                <TableBody className="bg-white dark:bg-card">
                  {renderSaleRows()}
                </TableBody>
              </Table>
              {groupedSales.length === 0 && emptyState("No company sales found")}
            </div>
          </TabsContent>
        </Tabs>

        <div className="print:hidden" data-print-hide>
          <DataPagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            className="!pl-6 !pr-3"
          />
        </div>
      </CardContent>
      </div>
    </Card>
  );
});

export default SalesTable;
