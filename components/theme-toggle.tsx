"use client"

import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { THEME_CONFIG } from "@/lib/config"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('auto')
    } else {
      setTheme('light')
    }
  }

  // Function to determine theme based on current time
  const getTimeBasedTheme = (): 'dark' | 'light' => {
    const hour = new Date().getHours()
    return hour >= THEME_CONFIG.AUTO_DARK_START_HOUR || hour < THEME_CONFIG.AUTO_DARK_END_HOUR ? 'dark' : 'light'
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
      case 'dark':
        return <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
      case 'auto':
        return <Monitor className="h-[1.2rem] w-[1.2rem] transition-all" />
      default:
        return <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
    }
  }

  const getTooltipText = () => {
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    
    switch (theme) {
      case 'light':
        return 'Light mode • Click for dark mode'
      case 'dark':
        return 'Dark mode • Click for auto mode'
      case 'auto':
        const currentAutoTheme = getTimeBasedTheme()
        return `Auto mode • Currently ${currentAutoTheme} (${currentTime}) • Click for light mode`
      default:
        return 'Toggle theme'
    }
  }

  return (
    <Button 
      variant="outline" 
      size="icon"
      className="h-10 w-10 text-foreground dark:text-foreground border-input hover:bg-accent hover:text-accent-foreground"
      onClick={cycleTheme}
      title={getTooltipText()}
    >
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
