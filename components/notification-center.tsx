"use client"

import { useState } from "react"
import { Bell, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import type { Notification } from "@/components/kharcha-check"

interface NotificationCenterProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onClearAll: () => void
}

export function NotificationCenter({ notifications, onMarkAsRead, onClearAll }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Warning
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Alert
          </Badge>
        )
      case "success":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Success
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Info
          </Badge>
        )
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <Card>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Notifications</h3>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearAll} className="h-8 px-2">
                <Trash2 className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
          <ScrollArea className="h-[300px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                <Bell className="h-10 w-10 text-muted-foreground mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`p-4 ${notification.read ? "bg-background" : "bg-muted/50"}`}>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notification.date), "MMM d, h:mm a")}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Mark as read</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
