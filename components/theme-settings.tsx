"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Monitor, Moon, Sun, Palette, Clock } from "lucide-react"
import { THEME_CONFIG } from "@/lib/config"

export function ThemeSettings() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'auto'>('auto')
  const [mounted, setMounted] = useState(false)

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

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    setCurrentTheme(theme)
    localStorage.setItem(THEME_CONFIG.STORAGE_KEY, theme)
    applyThemeToDocument(theme)
  }

  // Load saved theme on mount
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem(THEME_CONFIG.STORAGE_KEY) as 'light' | 'dark' | 'auto' || 'auto'
    setCurrentTheme(savedTheme)
  }, [])

  // Set up auto theme switching interval
  useEffect(() => {
    if (!mounted || currentTheme !== 'auto') return

    const interval = setInterval(() => {
      applyThemeToDocument('auto')
    }, THEME_CONFIG.THEME_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [currentTheme, mounted])

  const getCurrentStatus = () => {
    if (currentTheme === 'auto') {
      const timeBasedTheme = getTimeBasedTheme()
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
      return {
        mode: 'Auto',
        current: `Currently ${timeBasedTheme} mode (${currentTime})`,
        next: timeBasedTheme === 'dark' 
          ? 'Switches to light mode at 6:00 AM'
          : 'Switches to dark mode at 6:00 PM'
      }
    }
    return {
      mode: currentTheme === 'light' ? 'Light' : 'Dark',
      current: `${currentTheme === 'light' ? 'Light' : 'Dark'} mode active`,
      next: null
    }
  }

  if (!mounted) {
    return null
  }

  const status = getCurrentStatus()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Settings
        </CardTitle>
        <CardDescription>
          Configure your preferred color scheme and automatic theme switching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {currentTheme === 'light' && <Sun className="h-5 w-5 text-amber-500" />}
            {currentTheme === 'dark' && <Moon className="h-5 w-5 text-blue-400" />}
            {currentTheme === 'auto' && <Monitor className="h-5 w-5 text-green-500" />}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{status.mode} Mode</span>
                {currentTheme === 'auto' && (
                  <Badge variant="secondary" className="text-xs">
                    Time-based
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{status.current}</p>
              {status.next && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{status.next}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Theme Options */}
        <div className="space-y-3">
          <h4 className="font-medium">Choose Theme</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant={currentTheme === 'light' ? 'default' : 'outline'}
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setTheme('light')}
            >
              <Sun className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Light</div>
                <div className="text-xs text-muted-foreground">Always light mode</div>
              </div>
            </Button>

            <Button
              variant={currentTheme === 'dark' ? 'default' : 'outline'}
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setTheme('dark')}
            >
              <Moon className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Dark</div>
                <div className="text-xs text-muted-foreground">Always dark mode</div>
              </div>
            </Button>

            <Button
              variant={currentTheme === 'auto' ? 'default' : 'outline'}
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setTheme('auto')}
            >
              <Monitor className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Auto</div>
                <div className="text-xs text-muted-foreground">Time-based switching</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Auto Mode Info */}
        {currentTheme === 'auto' && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Auto Mode Schedule</h5>
            <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <div>🌅 Light mode: 6:00 AM - 6:00 PM</div>
              <div>🌙 Dark mode: 6:00 PM - 6:00 AM</div>
              <div className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                Theme switches automatically based on your local time
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
