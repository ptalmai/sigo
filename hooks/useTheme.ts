'use client'

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark') // dark como default server-side

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(next)
    localStorage.setItem('sigo-theme', next)
    setTheme(next)
  }

  return { theme, toggle, isDark: theme === 'dark' }
}
