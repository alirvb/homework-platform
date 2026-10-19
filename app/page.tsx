import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from "@/components/ui/primitives"

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-2xl border bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 p-8 md:p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative">
          <Badge variant="secondary" className="bg-white/20 text-white border-0 mb-4">نسخه ۱.۰ — برای کلاس هنر</Badge>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">سامانه مدیریت تکالیف هنر</h1>
          <p className="mt-3 text-white/90 leading-relaxed max-w-2xl">
            ارسال تکالیف، تصحیح سریع، و مدیریت نمرات میان‌ترم و پایان‌ترم — همه در یک داشبورد ساده و زیبا. با پشتیبانی کامل فارسی، حالت تیره/روشن و ذخیره‌سازی امن فایل‌ها.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex h-10 px-6 items-center justify-center rounded-md bg-white text-violet-700 font-medium hover:bg-white/90">شروع کنید — ثبت‌نام</Link>
            <Link href="/login" className="inline-flex h-10 px-6 items-center justify-center rounded-md border border-white/30 text-white hover:bg-white/10">ورود به حساب</Link>
          </div>
          <p className="mt-4 text-xs text-white/70">معلم هستید؟ ثبت‌نام کنید، کلاس بسازید و کد کلاس را به دانش‌آموزان بدهید. دانش‌آموز هستید؟ با کد کلاس وارد شوید.</p>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-4 mt-8">
        {[
          { title: "برای معلم", desc: "ساخت کلاس، تعریف تکالیف با مهلت و نمره، مشاهده ارسال‌ها به‌صورت دسته‌بندی‌شده و تصحیح سریع با بازخورد." },
          { title: "برای دانش‌آموز", desc: "پیوستن با کد کلاس، مشاهده تکالیف، آپلود تصویر/PDF و دیدن نمره و نظر معلم به‌صورت شفاف." },
          { title: "مدیریت نمرات", desc: "کارنامه ترمی شبیه اکسل، میانگین‌گیری خودکار و خروجی CSV برای ثبت نهایی نمرات." },
        ].map(c=>(
          <Card key={c.title}><CardHeader><CardTitle>{c.title}</CardTitle><CardDescription>{c.desc}</CardDescription></CardHeader></Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>راه‌اندازی سریع (برای توسعه‌دهنده)</CardTitle><CardDescription>فایل supabase.sql را در Supabase SQL Editor اجرا کنید و متغیرهای محیطی را تنظیم کنید.</CardDescription></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed">
          <div className="rounded-lg bg-muted p-3 font-mono text-xs ltr text-left" dir="ltr">
            NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co<br/>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...<br/># سپس: npm run dev
          </div>
          <p className="text-muted-foreground">بدون Supabase هم اپ در حالت دمو با داده‌های نمونه کار می‌کند (localStorage).</p>
        </CardContent>
      </Card>
    </main>
  )
}
