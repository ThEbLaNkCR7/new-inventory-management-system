"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { cn, formatNepaliDateForTable, toTitleCase } from "@/lib/utils";
import {
  pageToolbarClass,
  searchIconClass,
  searchInputClass,
  searchWrapClass,
  tabsCountBadgeClass,
  tabsListClass,
  tabsTriggerClass,
} from "@/lib/ui-styles";
import { usePagination } from "@/hooks/usePagination";
import { printSaleExactView } from "@/components/sales/utils";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  Search,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import DataPagination from "@/components/ui/data-pagination";
import { formatPurchaseTotal, getPurchaseTotal } from "./utils";

type PurchaseGroup = {
  supplier: string;
  purchases: Purchase[];
};

export type PurchasesTableHandle = {
  print: () => void;
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

const headCellClass = "h-14 text-base font-semibold text-navy";

function formatPurchaseProductNames(purchase: Purchase): string {
  const names = (purchase.items || [])
    .map((item: any) => item.productName)
    .filter(Boolean)
    .map((name: string) => toTitleCase(name));
  if (names.length === 0) {
    return (purchase as any).productName
      ? toTitleCase((purchase as any).productName)
      : "—";
  }
  return names.join(", ");
}

function getPurchaseItemCount(purchase: Purchase) {
  return (
    purchase.items?.length || ((purchase as any).productName ? 1 : 0)
  );
}

function renderItemsCell(purchase: Purchase) {
  const names = formatPurchaseProductNames(purchase);
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

const PurchasesTable = forwardRef<PurchasesTableHandle, PurchasesTableProps>(
  function PurchasesTable(
    {
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

    const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(
      new Set(),
    );

    const tabPurchases = React.useMemo(() => {
      if (activeTab === "individual") {
        return filteredPurchases.filter((p) => p.supplierType === "Individual");
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

      return Array.from(groups.entries())
        .map(([supplier, purchases]) => ({
          supplier,
          purchases: [...purchases].sort(
            (a, b) =>
              new Date(b.purchaseDate || 0).getTime() -
              new Date(a.purchaseDate || 0).getTime(),
          ),
        }))
        .sort((a, b) => {
          const aLatest = new Date(a.purchases[0]?.purchaseDate || 0).getTime();
          const bLatest = new Date(b.purchases[0]?.purchaseDate || 0).getTime();
          return bLatest - aLatest;
        }) as PurchaseGroup[];
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

    useImperativeHandle(ref, () => ({
      print: () => {
        printRestoreRef.current = {
          expanded: new Set(expandedSuppliers),
          page,
          pageSize,
        };
        printStartedRef.current = false;
        setExpandedSuppliers(
          new Set(groupedPurchases.map((group) => group.supplier)),
        );
        setPageSize(Math.max(groupedPurchases.length, 1));
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

      const allExpanded = groupedPurchases.every(
        (group) =>
          group.purchases.length === 1 ||
          expandedSuppliers.has(group.supplier),
      );
      const showingAll =
        pageSize >= groupedPurchases.length && page === 1;
      if (!allExpanded || !showingAll) return;

      printStartedRef.current = true;
      const timer = window.setTimeout(() => {
        if (!printRootRef.current) {
          setAwaitingPrint(false);
          return;
        }
        printSaleExactView(printRootRef.current, {
          wide: true,
          tableVariant: "purchases",
          onAfterPrint: () => {
            const prev = printRestoreRef.current;
            if (prev) {
              setExpandedSuppliers(prev.expanded);
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
      expandedSuppliers,
      groupedPurchases,
      page,
      pageSize,
      setPage,
      setPageSize,
    ]);

    const toggleExpanded = (supplier: string) => {
      setExpandedSuppliers((prev) => {
        const next = new Set(prev);
        if (next.has(supplier)) next.delete(supplier);
        else next.add(supplier);
        return next;
      });
    };

    const renderPurchaseActions = (purchase: Purchase) => (
      <div
        className="flex items-center space-x-2 print:hidden"
        data-print-hide
      >
        <Button
          size="sm"
          variant="neutralOutline"
          title="View"
          onClick={(e) => {
            e.stopPropagation();
            onView(purchase);
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
            onEdit(purchase);
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
            onDelete(purchase);
          }}
          className="text-muted-foreground transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );

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

    const renderPurchaseDetailRow = (purchase: Purchase) => {
      const itemCount = getPurchaseItemCount(purchase);
      return (
        <TableRow
          key={purchase.id}
          className="bg-white transition-colors duration-150 hover:bg-muted/40 dark:bg-card"
        >
          {renderExpandCell()}
          <TableCell>
            <div className="min-w-[100px]">
              <p className="text-sm tabular-nums text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            </div>
          </TableCell>
          <TableCell className="min-w-0 max-w-[7.5rem] sm:max-w-[11rem] lg:max-w-none">
            {renderItemsCell(purchase)}
          </TableCell>
          <TableCell className="text-sm font-normal text-navy">
            {formatNepaliDateForTable(purchase.purchaseDate)}
          </TableCell>
          <TableCell className="whitespace-nowrap text-right text-sm font-semibold tabular-nums text-navy">
            Rs {formatPurchaseTotal(purchase)}
          </TableCell>
          <TableCell className="print:hidden" data-print-hide>
            {renderPurchaseActions(purchase)}
          </TableCell>
        </TableRow>
      );
    };

    const renderPurchaseRows = () =>
      paginatedGroups.flatMap((group) => {
        if (group.purchases.length === 1) {
          const purchase = group.purchases[0];
          const itemCount = getPurchaseItemCount(purchase);
          return [
            <TableRow
              key={group.supplier}
              className="bg-white transition-colors duration-150 hover:bg-muted/40 dark:bg-card"
            >
              {renderExpandCell()}
              <TableCell>
                <div className="min-w-[100px]">
                  <p className="text-sm font-semibold text-navy">
                    {toTitleCase(group.supplier)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-normal tabular-nums text-muted-foreground">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
              </TableCell>
              <TableCell className="min-w-0 max-w-[7.5rem] sm:max-w-[11rem] lg:max-w-none">
                {renderItemsCell(purchase)}
              </TableCell>
              <TableCell className="text-sm font-normal text-navy">
                {formatNepaliDateForTable(purchase.purchaseDate)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right text-sm font-semibold tabular-nums text-navy">
                Rs {formatPurchaseTotal(purchase)}
              </TableCell>
              <TableCell className="print:hidden" data-print-hide>
                {renderPurchaseActions(purchase)}
              </TableCell>
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
            className="cursor-pointer bg-white transition-colors duration-150 hover:bg-muted/40 dark:bg-card dark:hover:bg-muted/60"
            onClick={() => toggleExpanded(group.supplier)}
          >
            {renderExpandCell(
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-md text-navy hover:bg-muted hover:text-navy"
                aria-label={
                  isExpanded ? "Collapse purchases" : "Expand purchases"
                }
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
                <p className="text-sm font-semibold text-navy">
                  {toTitleCase(group.supplier)}
                </p>
                <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                  {group.purchases.length}{" "}
                  {group.purchases.length === 1 ? "purchase" : "purchases"}
                </p>
              </div>
            </TableCell>
            <TableCell className="min-w-0 max-w-[7.5rem] sm:max-w-[11rem] lg:max-w-none" />
            <TableCell />
            <TableCell className="whitespace-nowrap text-right text-sm font-semibold tabular-nums text-navy">
              Rs {groupTotal.toLocaleString()}
            </TableCell>
            <TableCell className="print:hidden" data-print-hide />
          </TableRow>
        );

        if (!isExpanded) return [headerRow];

        return [headerRow, ...group.purchases.map(renderPurchaseDetailRow)];
      });

    const tableHeader = (
      <TableHeader>
        <TableRow className="border-0">
          <TableHead
            className="h-14 w-10 min-w-10 max-w-10 py-2 pl-6 pr-2 print:hidden"
            data-print-hide
          />
          <TableHead className={headCellClass}>Supplier</TableHead>
          <TableHead className={headCellClass}>Items</TableHead>
          <TableHead className={headCellClass}>Date</TableHead>
          <TableHead className={cn(headCellClass, "text-right")}>
            Total
          </TableHead>
          <TableHead
            className={cn(headCellClass, "print:hidden")}
            data-print-hide
          >
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
    );

    const emptyState = (message: string) => (
      <div className="py-8 text-center animate-in fade-in-0 duration-300">
        <p className="text-sm font-normal italic text-muted-foreground">
          {message}
        </p>
      </div>
    );

    const renderTable = (emptyMessage: string) => (
      <div className="overflow-x-auto bg-white dark:bg-card">
        <Table>
          {tableHeader}
          <TableBody className="bg-white dark:bg-card">
            {renderPurchaseRows()}
          </TableBody>
        </Table>
        {groupedPurchases.length === 0 && emptyState(emptyMessage)}
      </div>
    );

    return (
      <Card className="overflow-hidden border border-border bg-card shadow-sm">
        <div ref={printRootRef} className="purchases-table-print-root">
          <CardHeader className="px-3 pb-3 pt-5">
            <CardTitle className="pl-3 font-semibold text-navy">
              Purchase Orders
              <span className="ml-1.5 text-sm font-semibold text-navy">
                ({tabPurchases.length})
              </span>
            </CardTitle>

            <div
              className={cn(pageToolbarClass, "print:hidden")}
              data-print-hide
            >
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
                  className="h-10 shrink-0 gap-1.5 border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={onActiveTabChange}
              className="w-full"
            >
              <div className="px-3 pt-1 print:hidden" data-print-hide>
                <TabsList className={tabsListClass}>
                  <TabsTrigger
                    value="all"
                    className={cn(
                      tabsTriggerClass,
                      "data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none",
                    )}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>All Purchases</span>
                    <span className={tabsCountBadgeClass(activeTab === "all")}>
                      ({purchasesCounts.allCount})
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="individual"
                    className={cn(
                      tabsTriggerClass,
                      "data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none",
                    )}
                  >
                    <Users className="h-4 w-4" />
                    <span>Individual</span>
                    <span
                      className={tabsCountBadgeClass(
                        activeTab === "individual",
                      )}
                    >
                      ({purchasesCounts.individualCount})
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="company"
                    className={cn(
                      tabsTriggerClass,
                      "data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none",
                    )}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Company</span>
                    <span
                      className={tabsCountBadgeClass(activeTab === "company")}
                    >
                      ({purchasesCounts.companyCount})
                    </span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="all"
                className="mt-0 animate-in fade-in-0 slide-in-from-left-2 duration-300"
              >
                {renderTable("No purchases found")}
              </TabsContent>
              <TabsContent
                value="individual"
                className="mt-0 animate-in fade-in-0 slide-in-from-left-2 duration-300"
              >
                {renderTable("No individual purchases found")}
              </TabsContent>
              <TabsContent
                value="company"
                className="mt-0 animate-in fade-in-0 slide-in-from-left-2 duration-300"
              >
                {renderTable("No company purchases found")}
              </TabsContent>
            </Tabs>
            <div className="px-3 pb-4 print:hidden" data-print-hide>
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
            </div>
          </CardContent>
        </div>
      </Card>
    );
  },
);

export default PurchasesTable;
