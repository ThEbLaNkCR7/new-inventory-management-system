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
    console.log('Screen size check:', { width: window.innerWidth, mobile, sidebarOpen })
    setIsMobile(mobile)

    // Only auto-close when switching from desktop → mobile
    if (!prevIsMobile.current && mobile) {
      console.log('Auto-closing sidebar on mobile (desktop → mobile)')
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
        return <DashboardHome />
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
    <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        isMobile={isMobile}
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden relative transition-all duration-300 ${
        !isMobile && sidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Sidebar toggle button - only show on desktop when sidebar is closed */}
        {!isMobile && !sidebarOpen && (
          <button
            className="fixed top-4 left-4 z-50 flex items-center justify-center bg-gray-800 text-white rounded-full shadow-lg hover:shadow-xl p-2 hover:bg-gray-700 transition-all duration-300 hover:scale-110 transform"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
        
        <Header 
          onMenuClick={() => {
            console.log('Header menu clicked!', { currentSidebarOpen: sidebarOpen, isMobile })
            setSidebarOpen(!sidebarOpen)
          }} 
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
        />
        
        <main 
          ref={mainContentRef}
          className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 transition-colors duration-300"
        >
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
