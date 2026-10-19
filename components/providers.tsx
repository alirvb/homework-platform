"use client"
import { ThemeProvider } from "next-themes"
import { Navbar } from "@/components/navbar"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <Navbar />
      {children}
    </ThemeProvider>
  )
}
