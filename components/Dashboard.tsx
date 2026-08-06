"use client"

import ApprovalsPage from "@/components/approvals/ApprovalsPage"
import BatchesPage from "@/components/batches/BatchesPage"
import ClientsPage from "@/components/clients/ClientsPage"
import DashboardHome from "@/components/dashboard/DashboardHome"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import PurchasesPage from "@/components/purchases/PurchasesPage"
import ReportsPage from "@/components/reports/ReportsPage"
import VisualReports from "@/components/reports/VisualReports"
import SalesPage from "@/components/sales/SalesPage"
import StockViewPage from "@/components/stock/StockViewPage"
import LedgerAccountsPage from "@/components/ledger-accounts/LedgerAccountsPage"
import SuppliersPage from "@/components/suppliers/SuppliersPage"
import { ChevronRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import ProductsPage from "./products/ProductsPage"

export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "dashboard"
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isMobile, setIsMobile] = useState(false)
  
  // Initialize sidebar state from localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebarOpen')
      return stored ? JSON.parse(stored) : true // Default to open
    }
    return true
  })
  
  const mainContentRef = useRef<HTMLElement>(null)

  // Handle responsive behavior
  const prevIsMobile = useRef(false)

useEffect(() => {
  const checkScreenSize = () => {
    const mobile = window.innerWidth < 1024
    setIsMobile(mobile)

    // Only auto-close when switching from desktop → mobile
    if (!prevIsMobile.current && mobile) {
      setSidebarOpen(false)
    }

    prevIsMobile.current = mobile
  }

  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  return () => window.removeEventListener('resize', checkScreenSize)
}, []) // No dependency on sidebarOpen

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen))
  }, [sidebarOpen])

  // Update URL when activeTab changes
  useEffect(() => {
    if (activeTab) {
      const params = new URLSearchParams(window.location.search)
      params.set("tab", activeTab)
      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState({}, "", newUrl)
    }
  }, [activeTab])

  // Reset scroll position when activeTab changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0
    }
  }, [activeTab])

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHome onNavigate={setActiveTab} />
      case "products":
        return <ProductsPage />
      case "stock-view":
        return <StockViewPage />
      case "batches":
        return <BatchesPage />
      case "purchases":
        return <PurchasesPage />
      case "sales":
        return <SalesPage />
      case "clients":
        return <ClientsPage />
      case "suppliers":
        return <SuppliersPage />
      case "ledger-accounts":
        return <LedgerAccountsPage />
      case "approvals":
        return <ApprovalsPage />
      case "reports":
        return <ReportsPage />
      case "visual-reports":
        return <VisualReports />
      default:
        return <DashboardHome />
    }
  }

  return (
    <div className="flex h-screen bg-background transition-colors duration-300 print:block print:h-auto print:overflow-visible">
      <div className="print:hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          isMobile={isMobile}
        />
      </div>

      <div
        className={`relative flex flex-1 flex-col overflow-hidden transition-all duration-300 print:ml-0 print:w-full print:overflow-visible ${
 !isMobile && sidebarOpen ? "ml-64" : "ml-0"
 }`}
      >
        {!isMobile && !sidebarOpen && (
          <button
            className="fixed left-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-navy transition-colors hover:bg-muted print:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div className="print:hidden">
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
            isMobile={isMobile}
          />
        </div>

        <main
          ref={mainContentRef}
          className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-5 lg:p-6 print:overflow-visible print:p-0"
        >
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
