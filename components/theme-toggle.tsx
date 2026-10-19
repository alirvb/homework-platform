"use client"
import * as React from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(()=>setMounted(true),[])
  if (!mounted) return <button className="h-9 w-9 rounded-md border bg-card" aria-label="toggle" />
  return (
    <button
      onClick={()=> setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9 inline-flex items-center justify-center rounded-md border bg-card hover:bg-accent transition-colors"
      aria-label="تغییر تم"
      title={theme === "dark" ? "حالت روشن" : "حالت تیره"}
    >
      <span className="text-sm">{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  )
}
