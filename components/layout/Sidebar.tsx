"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import {
  sidebarChromeHoverClass,
  sidebarNavIconActiveClass,
  sidebarNavIconInactiveClass,
  sidebarNavItemActiveClass,
  sidebarNavItemClass,
  sidebarNavItemInactiveClass,
} from "@/lib/ui-styles"
import { cn } from "@/lib/utils"
import { BarChart3, BookOpen, CheckCircle, ChevronLeft, Home, Package, ShoppingCart, TrendingUp, Truck, Users, X } from "lucide-react"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isMobile: boolean
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, isMobile }: SidebarProps) {
  const { user } = useAuth()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, adminOnly: false },
    { id: "products", label: "Products", icon: Package, adminOnly: false },
    { id: "sales", label: "Sales", icon: TrendingUp, adminOnly: false },
    { id: "purchases", label: "Purchases", icon: ShoppingCart, adminOnly: false },
    { id: "stock-view", label: "Stock View", icon: Package, adminOnly: false },
    { id: "batches", label: "Batches", icon: Truck, adminOnly: true },
    { id: "clients", label: "Clients", icon: Users, adminOnly: false },
    { id: "suppliers", label: "Suppliers", icon: Truck, adminOnly: false },
    { id: "ledger-accounts", label: "Ledger Account", icon: BookOpen, adminOnly: false },
    { id: "approvals", label: "Approvals", icon: CheckCircle, adminOnly: true },
    { id: "reports", label: "Reports", icon: BarChart3, adminOnly: true },
  ]

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.adminOnly) return true
    return user?.role === "admin"
  })

  const handleMenuItemClick = (itemId: string) => {
    setActiveTab(itemId)
    if (isMobile) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card
 transition-transform duration-300 ease-in-out
 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <div className={`min-w-0 flex-1 pr-2 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}>
            <p className="truncate font-sans text-base font-semibold tracking-tight text-navy">
              Sheel Waterproofing
            </p>
            <p className="truncate font-sans text-xs text-muted-foreground">Inventory</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            {isMobile ? (
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", sidebarChromeHoverClass)}
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", sidebarChromeHoverClass)}
                onClick={() => setIsOpen(false)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-3">
          <div className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMenuItemClick(item.id)}
                  className={cn(
                    sidebarNavItemClass,
                    isActive ? sidebarNavItemActiveClass : sidebarNavItemInactiveClass,
                  )}
                >
                  <Icon
                    className={
                      isActive ? sidebarNavIconActiveClass : sidebarNavIconInactiveClass
                    }
                  />
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="flex-shrink-0 border-t border-border bg-muted/50 p-3">
          <div className="rounded-md border border-border bg-card px-3 py-2.5">
            <p className="truncate font-sans text-sm font-medium text-navy">{user?.name || "User"}</p>
            <p className="truncate font-sans text-xs capitalize text-muted-foreground">{user?.role || "guest"}</p>
          </div>
        </div>
      </aside>
    </>
  )
}
