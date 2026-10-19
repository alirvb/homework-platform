"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/primitives"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [email, setEmail] = useState<string>("")

  useEffect(()=>{
    const supa = createClient()
    supa.auth.getUser().then(({data})=>{
      if (data.user) {
        setEmail(data.user.email || "")
        supa.from("profiles").select("role").eq("user_id", data.user.id).single().then(({data: p})=>{
          if (p) setRole(p.role)
        })
      }
    })
  }, [pathname])

  const logout = async () => {
    const supa = createClient()
    await supa.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname === "/"

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg tracking-tight">🎨 سامانه تکالیف</Link>
          {!isAuth && role && (
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link href={role === "teacher" ? "/teacher" : "/student"} className={`px-3 py-1.5 rounded-md ${pathname.includes(role) ? "bg-secondary" : "hover:bg-accent"}`}>داشبورد</Link>
              {role === "teacher" && <Link href="/teacher/submissions" className={`px-3 py-1.5 rounded-md ${pathname.includes("submissions") ? "bg-secondary" : "hover:bg-accent"}`}>ارسال‌ها</Link>}
              {role === "teacher" && <Link href="/teacher/gradebook" className={`px-3 py-1.5 rounded-md ${pathname.includes("gradebook") ? "bg-secondary" : "hover:bg-accent"}`}>کارنامه</Link>}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {email ? (
            <>
              <span className="hidden sm:inline text-xs text-muted-foreground max-w-[160px] truncate">{email}</span>
              <Button variant="outline" size="sm" onClick={logout}>خروج</Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" size="sm">ورود</Button></Link>
              <Link href="/register"><Button size="sm">ثبت‌نام</Button></Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
