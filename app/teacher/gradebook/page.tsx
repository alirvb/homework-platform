"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from "@/components/ui/primitives"
import { createClient } from "@/lib/supabase/client"
import type { ClassItem, Assignment, Submission } from "@/lib/types"

export default function GradebookPage() {
  const demo = !process.env.NEXT_PUBLIC_SUPABASE_URL
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [profiles, setProfiles] = useState<Record<string,string>>({})
  const [selectedClass, setSelectedClass] = useState<string>("")

  const load = async () => {
    if (demo) {
      const cls: ClassItem[] = JSON.parse(localStorage.getItem("demo_classes")||"[]")
      setClasses(cls); if (cls[0]) setSelectedClass(cls[0].id)
      setAssignments(JSON.parse(localStorage.getItem("demo_assignments")||"[]"))
      setSubmissions(JSON.parse(localStorage.getItem("demo_submissions")||"[]"))
      const users: any[] = JSON.parse(localStorage.getItem("demo_users")||"[]")
      const map: Record<string,string> = {}; users.forEach(u=> map[u.id]=u.full_name); setProfiles(map)
      return
    }
    const supa = createClient()
    const { data: { user: u } } = await supa.auth.getUser(); if (!u) return
    const { data: cls } = await supa.from("classes").select("*").eq("teacher_id", u.id); setClasses((cls as any)||[]); if (cls?.[0]) setSelectedClass(cls[0].id)
    if (cls?.length) {
      const ids = cls.map(c=>c.id)
      const { data: assigns } = await supa.from("assignments").select("*").in("class_id", ids); setAssignments((assigns as any)||[])
      if (assigns?.length) {
        const aIds = assigns.map(a=> (a as any).id)
        const { data: subs } = await supa.from("submissions").select("*").in("assignment_id", aIds); setSubmissions((subs as any)||[])
        const sIds = Array.from(new Set((subs||[]).map(s=>s.student_id)))
        if (sIds.length) {
          const { data: profs } = await supa.from("profiles").select("user_id, full_name").in("user_id", sIds)
          const m: Record<string,string> = {}; (profs||[]).forEach(p=> m[p.user_id]=p.full_name); setProfiles(m)
        }
      }
    }
  }
  useEffect(()=>{ load() }, [])

  const classAssigns = assignments.filter(a=> a.class_id===selectedClass)
  // students in class
  const studentIds = Array.from(new Set(submissions.filter(s=> classAssigns.some(a=>a.id===s.assignment_id)).map(s=>s.student_id)))
  // also include enrolled without submissions
  // for demo, read enrollments
  const extraIds = (()=>{ if (!demo) return []; const enrolls: any[] = JSON.parse(localStorage.getItem("demo_enrollments")||"[]"); return enrolls.filter(e=>e.class_id===selectedClass).map(e=>e.student_id) })()
  const allStudentIds = Array.from(new Set([...studentIds, ...extraIds]))

  const avg = (id: string) => {
    const grades = submissions.filter(s=> s.student_id===id && classAssigns.some(a=>a.id===s.assignment_id) && s.grade!=null).map(s=> s.grade!)
    if (!grades.length) return "-"
    return (grades.reduce((a,b)=>a+b,0)/grades.length).toFixed(1)
  }

  const exportCSV = () => {
    const headers = ["دانش‌آموز", ...classAssigns.map(a=>a.title), "میانگین"]
    const rows = allStudentIds.map(sid=>{
      const name = profiles[sid] || sid.slice(0,8)
      const grades = classAssigns.map(a=> {
        const sub = submissions.find(s=> s.assignment_id===a.id && s.student_id===sid)
        return sub?.grade ?? ""
      })
      return [name, ...grades, avg(sid)]
    })
    const csv = [headers, ...rows].map(r=> r.map(v=> `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"})
    const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`gradebook_${selectedClass}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">کارنامه</h1><p className="text-sm text-muted-foreground">نمای شبیه اکسل + خروجی CSV</p></div>
        <Button onClick={exportCSV} variant="outline">خروجی CSV</Button>
      </div>
      {classes.length===0 ? <Card><CardContent className="p-6 text-sm text-muted-foreground">کلاسی وجود ندارد.</CardContent></Card> : (
        <>
          <div className="flex gap-2 flex-wrap">
            {classes.map(c=> <Button key={c.id} size="sm" variant={selectedClass===c.id?"default":"outline"} onClick={()=>setSelectedClass(c.id)}>{c.class_name}</Button>)}
          </div>
          <Card className="overflow-auto">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-right p-3 whitespace-nowrap">دانش‌آموز</th>
                    {classAssigns.map(a=> <th key={a.id} className="text-center p-3 whitespace-nowrap">{a.title}<br/><span className="text-xs text-muted-foreground">{a.max_score} نمره • {a.category==="midterm"?"میان‌ترم": a.category==="final"?"پایانی":"عادی"}</span></th>)}
                    <th className="text-center p-3 bg-primary/10">میانگین</th>
                  </tr>
                </thead>
                <tbody>
                  {allStudentIds.length===0 && <tr><td colSpan={classAssigns.length+2} className="p-6 text-center text-muted-foreground">دانش‌آموزی یافت نشد — دانش‌آموز باید با کد کلاس عضو شود و تکلیف ارسال کند.</td></tr>}
                  {allStudentIds.map(sid=>(
                    <tr key={sid} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium whitespace-nowrap">{profiles[sid] || sid.slice(0,8)}</td>
                      {classAssigns.map(a=>{
                        const sub = submissions.find(s=> s.assignment_id===a.id && s.student_id===sid)
                        return <td key={a.id} className="p-3 text-center">{sub?.grade ?? (sub ? "—" : "—")}{sub?.status==="late" ? " (دیرکرد)" : ""}</td>
                      })}
                      <td className="p-3 text-center font-bold bg-primary/5">{avg(sid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">میانگین به‌صورت ساده از نمرات ثبت‌شده محاسبه می‌شود. برای فرمول وزن‌دار میان‌ترم/پایانی می‌توانید ستون‌ها را وزن‌دهی کنید.</p>
        </>
      )}
    </div>
  )
}
