"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { formatDistanceToNow } from "date-fns"
import { AlertCircle, Bell, CheckCircle, Info, LogOut, Menu, Settings, User, X } from "lucide-react"

interface HeaderProps {
  onMenuClick: () => void
  sidebarOpen: boolean
  isMobile: boolean
}

export default function Header({ onMenuClick, sidebarOpen, isMobile }: HeaderProps) {
  const { user, logout } = useAuth()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useNotifications()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-navy/70" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-navy/70" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-navy/70" />
      case "info":
        return <Info className="h-4 w-4 text-muted-foreground" />
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-navy lg:hidden"
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {isMobile && !sidebarOpen && (
            <h1 className="truncate font-sans text-base font-semibold tracking-tight text-navy">
              Sheel Waterproofing
            </h1>
          )}

          {!isMobile && (
            <div
              className={`hidden items-center gap-3 transition-opacity duration-300 lg:flex ${
 sidebarOpen ? "opacity-0" : "opacity-100"
 }`}
            >
              <img
                src="/assets/logos/logo.svg"
                alt="Sheel Waterproofing"
                width={36}
                height={32}
                className="h-8 w-auto dark:invert"
              />
              <span className="font-sans text-base font-semibold tracking-tight text-navy">
                Sheel Waterproofing
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-navy"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end" forceMount>
              <DropdownMenuLabel className="flex items-center justify-between">
                <span className="font-semibold">Notifications</span>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-6 px-2 text-xs shadow-none">
                      Mark all read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllNotifications}
                      className="h-6 px-2 text-xs text-navy shadow-none hover:text-navy/80"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="mx-auto mb-2 h-7 w-7 opacity-40" />
                  <p className="text-sm font-normal italic text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.slice(0, 10).map((notification) => (
                    <div key={notification.id} className="group relative">
                      <DropdownMenuItem
                        className={`mb-1 flex cursor-pointer flex-col items-start gap-2 rounded-md p-3 ${
 !notification.read ? "bg-muted dark:bg-white/[0.06]" : ""
 }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-start gap-2">
                            {getNotificationIcon(notification.type)}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-navy">
                                {notification.title}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {notification.message}
                              </p>
                              <p className="mt-1 text-[11px] text-muted-foreground/80">
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 opacity-0 shadow-none group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeNotification(notification.id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </DropdownMenuItem>
                    </div>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt={user?.name || "User"} />
                  <AvatarFallback className="border border-border bg-muted text-sm text-navy">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || ""}</p>
                  <p className="text-xs capitalize leading-none text-muted-foreground">{user?.role || "None"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
