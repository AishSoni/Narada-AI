"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { THEME_CONFIG } from '@/lib/config'

type Theme = 'dark' | 'light' | 'auto'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(THEME_CONFIG.DEFAULT_THEME as Theme)
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light')
  const [mounted, setMounted] = useState(false)

  // Function to determine theme based on current time
  const getTimeBasedTheme = (): 'dark' | 'light' => {
    const hour = new Date().getHours()
    // Dark mode between DARK_START_HOUR and DARK_END_HOUR
    return hour >= THEME_CONFIG.AUTO_DARK_START_HOUR || hour < THEME_CONFIG.AUTO_DARK_END_HOUR ? 'dark' : 'light'
  }

  // Function to apply theme
  const applyTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    
    if (newTheme === 'auto') {
      const timeBasedTheme = getTimeBasedTheme()
      setResolvedTheme(timeBasedTheme)
      if (mounted) {
        if (timeBasedTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        localStorage.setItem(THEME_CONFIG.STORAGE_KEY, 'auto')
      }
    } else {
      setResolvedTheme(newTheme)
      if (mounted) {
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        localStorage.setItem(THEME_CONFIG.STORAGE_KEY, newTheme)
      }
    }
  }

  useEffect(() => {
    setMounted(true)
    
    // Load saved theme preference or default to auto
    const savedTheme = (localStorage.getItem(THEME_CONFIG.STORAGE_KEY) as Theme) || (THEME_CONFIG.DEFAULT_THEME as Theme)
    
    // Apply initial theme
    if (savedTheme === 'auto') {
      const timeBasedTheme = getTimeBasedTheme()
      setTheme('auto')
      setResolvedTheme(timeBasedTheme)
      if (timeBasedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else {
      setTheme(savedTheme)
      setResolvedTheme(savedTheme)
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // Set up interval to update auto theme based on time
    let interval: NodeJS.Timeout
    
    if (savedTheme === 'auto') {
      interval = setInterval(() => {
        const currentTimeTheme = getTimeBasedTheme()
        setResolvedTheme(prev => {
          if (currentTimeTheme !== prev) {
            if (currentTimeTheme === 'dark') {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
            return currentTimeTheme
          }
          return prev
        })
      }, THEME_CONFIG.THEME_CHECK_INTERVAL)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  // Update interval when theme changes
  useEffect(() => {
    if (!mounted) return

    let interval: NodeJS.Timeout
    
    if (theme === 'auto') {
      interval = setInterval(() => {
        const currentTimeTheme = getTimeBasedTheme()
        setResolvedTheme(prev => {
          if (currentTimeTheme !== prev) {
            if (currentTimeTheme === 'dark') {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
            return currentTimeTheme
          }
          return prev
        })
      }, THEME_CONFIG.THEME_CHECK_INTERVAL)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [theme, mounted])

  const contextValue: ThemeContextType = {
    theme,
    setTheme: applyTheme,
    resolvedTheme,
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{
        theme: THEME_CONFIG.DEFAULT_THEME as Theme,
        setTheme: () => {},
        resolvedTheme: 'light'
      }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
