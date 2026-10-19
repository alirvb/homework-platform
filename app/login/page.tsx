"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label } from "@/components/ui/primitives"
import { createClient } from "@/lib/supabase/client"

function useSupabaseConfigured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL
}

export default function LoginPage() {
  const router = useRouter()
  const configured = useSupabaseConfigured()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(""); setLoading(true)
    try {
      if (configured) {
        const supa = createClient()
        const { error } = await supa.auth.signInWithPassword({ email, password })
        if (error) throw error
        const { data: { user } } = await supa.auth.getUser()
        if (user) {
          const { data: profile } = await supa.from("profiles").select("role").eq("user_id", user.id).single()
          router.push(profile?.role === "teacher" ? "/teacher" : "/student")
        } else router.push("/teacher")
      } else {
        const raw = localStorage.getItem("demo_users")
        const users: any[] = raw ? JSON.parse(raw) : []
        const u = users.find(x=> x.email===email && x.password===password)
        if (!u) throw new Error("ایمیل یا رمز عبور اشتباه است (دمو: ابتدا ثبت‌نام کنید)")
        localStorage.setItem("demo_session", JSON.stringify(u))
        router.push(u.role === "teacher" ? "/teacher" : "/student")
      }
    } catch (e:any) { setErr(e.message || "خطا در ورود") }
    finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader><CardTitle>ورود</CardTitle><CardDescription>با ایمیل و رمز عبور وارد شوید</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2"><Label>ایمیل</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" dir="ltr" /></div>
            <div className="space-y-2"><Label>رمز عبور</Label><Input type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>
            {err && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded-md">{err}</p>}
            {!configured && <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-md">حالت دمو فعال است — داده‌ها در مرورگر ذخیره می‌شوند.</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? "در حال ورود..." : "ورود"}</Button>
            <p className="text-sm text-center text-muted-foreground">حساب ندارید؟ <a href="/register" className="text-primary underline">ثبت‌نام</a></p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
