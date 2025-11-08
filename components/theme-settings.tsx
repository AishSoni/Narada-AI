"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Monitor, Moon, Sun, Palette, Clock } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export function ThemeSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const getCurrentStatus = () => {
    if (theme === 'auto') {
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
      return {
        mode: 'Auto',
        current: `Currently ${resolvedTheme} mode (${currentTime})`,
        next: resolvedTheme === 'dark' 
          ? 'Switches to light mode at 6:00 AM'
          : 'Switches to dark mode at 6:00 PM'
      }
    }
    return {
      mode: theme === 'light' ? 'Light' : 'Dark',
      current: `${theme === 'light' ? 'Light' : 'Dark'} mode active`,
      next: null
    }
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
            {theme === 'light' && <Sun className="h-5 w-5 text-amber-500" />}
            {theme === 'dark' && <Moon className="h-5 w-5 text-blue-400" />}
            {theme === 'auto' && <Monitor className="h-5 w-5 text-green-500" />}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{status.mode} Mode</span>
                {theme === 'auto' && (
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
              variant={theme === 'light' ? 'default' : 'outline'}
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
              variant={theme === 'dark' ? 'default' : 'outline'}
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
              variant={theme === 'auto' ? 'default' : 'outline'}
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
      </CardContent>
    </Card>
  )
}
