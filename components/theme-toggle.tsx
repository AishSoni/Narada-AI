"use client"

import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { THEME_CONFIG } from "@/lib/config"

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'auto'>('auto')
  const [mounted, setMounted] = React.useState(false)

  // Function to determine theme based on current time
  const getTimeBasedTheme = (): 'dark' | 'light' => {
    const hour = new Date().getHours()
    return hour >= THEME_CONFIG.AUTO_DARK_START_HOUR || hour < THEME_CONFIG.AUTO_DARK_END_HOUR ? 'dark' : 'light'
  }

  // Function to apply theme to document
  const applyThemeToDocument = (themeToApply: 'light' | 'dark' | 'auto') => {
    if (themeToApply === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (themeToApply === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // Auto mode - check time
      const timeBasedTheme = getTimeBasedTheme()
      document.documentElement.classList.toggle('dark', timeBasedTheme === 'dark')
    }
  }

  const cycleTheme = () => {
    let newTheme: 'light' | 'dark' | 'auto'
    
    if (theme === 'light') {
      newTheme = 'dark'
    } else if (theme === 'dark') {
      newTheme = 'auto'
    } else {
      newTheme = 'light'
    }
    
    setTheme(newTheme)
    localStorage.setItem(THEME_CONFIG.STORAGE_KEY, newTheme)
    applyThemeToDocument(newTheme)
  }

  // Load saved theme and apply on mount
  React.useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem(THEME_CONFIG.STORAGE_KEY) as 'light' | 'dark' | 'auto' || 'auto'
    setTheme(savedTheme)
    applyThemeToDocument(savedTheme)
  }, [])

  // Set up auto theme switching interval
  React.useEffect(() => {
    if (!mounted || theme !== 'auto') return

    const interval = setInterval(() => {
      applyThemeToDocument('auto')
    }, THEME_CONFIG.THEME_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [theme, mounted])

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

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        size="icon"
        className="h-10 w-10"
        disabled
      >
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button 
      variant="outline" 
      size="icon"
      className="h-10 w-10"
      onClick={cycleTheme}
      title={getTooltipText()}
    >
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
