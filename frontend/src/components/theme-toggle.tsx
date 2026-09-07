"use client"
import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="fixed bottom-6 right-6 p-3 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all z-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Alternar tema"
    >
      {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
    </button>
  )
}
