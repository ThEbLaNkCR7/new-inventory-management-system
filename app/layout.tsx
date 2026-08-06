import type React from "react"
import { IBM_Plex_Sans } from "next/font/google"
import { AuthProvider } from "@/contexts/AuthContext"
import { InventoryProvider } from "@/contexts/InventoryContext"
import { BatchProvider } from "@/contexts/BatchContext"
import { ApprovalProvider } from "@/contexts/ApprovalContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { FormPersistenceProvider } from "@/contexts/FormPersistenceContext"
import { LedgerProvider } from "@/contexts/LedgerContext"
import "./globals.css"

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plexSans.variable} font-sans min-h-screen bg-background text-foreground transition-colors duration-300 antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {/* inventory must exist before approval; approval applies inventory changes */}
            <InventoryProvider>
              <LedgerProvider>
                <ApprovalProvider>
                  <BatchProvider>
                    <NotificationProvider>
                      <FormPersistenceProvider>
                        {children}
                      </FormPersistenceProvider>
                    </NotificationProvider>
                  </BatchProvider>
                </ApprovalProvider>
              </LedgerProvider>
            </InventoryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
  generator: 'v0.dev'
};
