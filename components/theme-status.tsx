"use client"

import { useTheme } from "@/components/theme-provider"
import { Monitor, Moon, Sun, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function ThemeStatus() {
  const { theme, resolvedTheme } = useTheme()

  const getTimeInfo = () => {
    const now = new Date()
    const hour = now.getHours()
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    
    if (theme === 'auto') {
      const isDarkTime = hour >= 18 || hour < 6
      const nextSwitch = isDarkTime 
        ? `Light mode at 6:00 AM`
        : `Dark mode at 6:00 PM`
      
      return {
        current: `${resolvedTheme === 'dark' ? 'Dark' : 'Light'} (${timeString})`,
        next: nextSwitch
      }
    }
    
    return null
  }

  const timeInfo = getTimeInfo()

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        {theme === 'light' && <Sun className="h-4 w-4" />}
        {theme === 'dark' && <Moon className="h-4 w-4" />}
        {theme === 'auto' && <Monitor className="h-4 w-4" />}
        
        <span className="capitalize">{theme}</span>
        {theme === 'auto' && (
          <Badge variant="secondary" className="text-xs">
            Auto
          </Badge>
        )}
      </div>
      
      {timeInfo && (
        <div className="flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          <span>{timeInfo.current}</span>
          <span className="text-muted-foreground/70">• {timeInfo.next}</span>
        </div>
      )}
    </div>
  )
}
