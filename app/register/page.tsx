"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Select } from "@/components/ui/primitives"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const router = useRouter()
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"teacher"|"student">("teacher")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(""); setLoading(true)
    try {
      if (configured) {
        const supa = createClient()
        const { data, error } = await supa.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } })
        if (error) throw error
        if (data.user) {
          router.push(role === "teacher" ? "/teacher" : "/student")
        }
      } else {
        const raw = localStorage.getItem("demo_users")
        const users: any[] = raw ? JSON.parse(raw) : []
        if (users.some(u=>u.email===email)) throw new Error("این ایمیل قبلاً ثبت شده است")
        const u = { id: Math.random().toString(36).slice(2), email, password, full_name: fullName, role }
        users.push(u); localStorage.setItem("demo_users", JSON.stringify(users))
        localStorage.setItem("demo_session", JSON.stringify(u))
        router.push(role === "teacher" ? "/teacher" : "/student")
      }
    } catch (e:any) { setErr(e.message || "خطا در ثبت‌نام") }
    finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader><CardTitle>ثبت‌نام</CardTitle><CardDescription>نقش خود را انتخاب کنید</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2"><Label>نام و نام خانوادگی</Label><Input required value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="مثلاً سارا احمدی" /></div>
            <div className="space-y-2"><Label>ایمیل</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} dir="ltr" placeholder="you@example.com" /></div>
            <div className="space-y-2"><Label>رمز عبور</Label><Input type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>
            <div className="space-y-2"><Label>نقش</Label>
              <Select value={role} onChange={e=>setRole(e.target.value as any)}>
                <option value="teacher">معلم</option>
                <option value="student">دانش‌آموز</option>
              </Select>
              <p className="text-xs text-muted-foreground">معلم می‌تواند کلاس بسازد؛ دانش‌آموز با کد کلاس عضو می‌شود.</p>
            </div>
            {err && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded-md">{err}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? "در حال ثبت..." : "ثبت‌نام"}</Button>
            <p className="text-sm text-center text-muted-foreground">قبلاً ثبت‌نام کرده‌اید؟ <a href="/login" className="text-primary underline">ورود</a></p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
