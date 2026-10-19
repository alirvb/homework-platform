"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Select, Badge, Separator } from "@/components/ui/primitives"
import { createClient } from "@/lib/supabase/client"
import { generateClassCode } from "@/lib/utils"
import type { ClassItem, Assignment, Submission } from "@/lib/types"
import { CATEGORY_LABEL, STATUS_LABEL } from "@/lib/types"

type Tab = "classes" | "assignments" | "submissions"

function useDemo() { return !process.env.NEXT_PUBLIC_SUPABASE_URL }

export default function TeacherDashboard() {
  const demo = useDemo()
  const [tab, setTab] = useState<Tab>("classes")
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<(Submission & { assignment_title?: string; student_name?: string })[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterClass, setFilterClass] = useState<string>("all")

  // forms
  const [className, setClassName] = useState(""); const [subject, setSubject] = useState("هنر")
  const [assignTitle, setAssignTitle] = useState(""); const [assignDesc, setAssignDesc] = useState("")
  const [assignClass, setAssignClass] = useState(""); const [assignDue, setAssignDue] = useState("")
  const [assignMax, setAssignMax] = useState(20); const [assignCat, setAssignCat] = useState<"regular"|"midterm"|"final">("regular")
  const [gradeInputs, setGradeInputs] = useState<Record<string,{grade:string, feedback:string}>>({})

  const load = async () => {
    if (demo) {
      const sess = localStorage.getItem("demo_session"); const u = sess ? JSON.parse(sess) : null; setUser(u)
      setClasses(JSON.parse(localStorage.getItem("demo_classes") || "[]"))
      setAssignments(JSON.parse(localStorage.getItem("demo_assignments") || "[]"))
      setSubmissions(JSON.parse(localStorage.getItem("demo_submissions") || "[]"))
      return
    }
    const supa = createClient()
    const { data: { user: authUser } } = await supa.auth.getUser()
    setUser(authUser)
    if (!authUser) return
    const { data: cls } = await supa.from("classes").select("*").eq("teacher_id", authUser.id).order("created_at", { ascending: false })
    setClasses((cls as any) || [])
    if (cls && cls.length) {
      const ids = cls.map(c=>c.id)
      const { data: assigns } = await supa.from("assignments").select("*").in("class_id", ids).order("created_at", { ascending: false })
      setAssignments((assigns as any) || [])
      if (assigns && assigns.length) {
        const aIds = assigns.map(a=>a.id)
        const { data: subs } = await supa.from("submissions").select("*").in("assignment_id", aIds).order("submitted_at", {ascending:false})
        // enrich with assignment title and student name
        const enriched: any[] = (subs || []).map(s=>{
          const a = assigns.find(x=>x.id===s.assignment_id)
          return { ...s, assignment_title: a?.title }
        })
        // fetch student names
        const sIds = Array.from(new Set(enriched.map((e:any)=>e.student_id)))
        if (sIds.length) {
          const { data: profiles } = await supa.from("profiles").select("user_id, full_name").in("user_id", sIds)
          const map = new Map((profiles||[]).map(p=>[p.user_id, p.full_name]))
          enriched.forEach(e=> e.student_name = map.get(e.student_id) || e.student_id.slice(0,8))
        }
        setSubmissions(enriched)
      }
    }
  }
  useEffect(()=>{ load() }, [])

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!className.trim()) return
    const code = generateClassCode()
    if (demo) {
      const sess = JSON.parse(localStorage.getItem("demo_session")||"{}")
      const item: ClassItem = { id: Math.random().toString(36).slice(2), teacher_id: sess.id, class_name: className, subject, class_code: code, created_at: new Date().toISOString() }
      const next = [item, ...classes]; setClasses(next); localStorage.setItem("demo_classes", JSON.stringify(next))
      setClassName(""); return
    }
    const supa = createClient(); const { data: { user: u } } = await supa.auth.getUser()
    if (!u) return
    const { error } = await supa.from("classes").insert({ teacher_id: u.id, class_name: className, subject, class_code: code })
    if (!error) { setClassName(""); load() }
  }

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignTitle.trim() || !assignClass) return
    if (demo) {
      const item: Assignment = { id: Math.random().toString(36).slice(2), class_id: assignClass, title: assignTitle, description: assignDesc, due_date: assignDue ? new Date(assignDue).toISOString() : new Date(Date.now()+7*86400000).toISOString(), max_score: assignMax, category: assignCat, created_at: new Date().toISOString() }
      const next = [item, ...assignments]; setAssignments(next); localStorage.setItem("demo_assignments", JSON.stringify(next))
      setAssignTitle(""); setAssignDesc(""); return
    }
    const supa = createClient()
    const { error } = await supa.from("assignments").insert({ class_id: assignClass, title: assignTitle, description: assignDesc, due_date: assignDue ? new Date(assignDue).toISOString() : null, max_score: assignMax, category: assignCat })
    if (!error) { setAssignTitle(""); setAssignDesc(""); load() }
  }

  const saveGrade = async (sub: any) => {
    const inp = gradeInputs[sub.id]; if (!inp) return
    const grade = parseFloat(inp.grade); const feedback = inp.feedback
    if (demo) {
      const next = submissions.map(s=> s.id===sub.id ? { ...s, grade: isNaN(grade) ? null : grade, teacher_feedback: feedback, status: "graded" as const, graded_at: new Date().toISOString() } : s)
      setSubmissions(next); localStorage.setItem("demo_submissions", JSON.stringify(next)); return
    }
    const supa = createClient()
    await supa.from("submissions").update({ grade: isNaN(grade)? null : grade, teacher_feedback: feedback, status: "graded", graded_at: new Date().toISOString() }).eq("id", sub.id)
    load()
  }

  const filteredSubs = submissions.filter(s=>{
    if (filterStatus !== "all" && s.status !== filterStatus) return false
    if (filterClass !== "all") {
      const a = assignments.find(x=>x.id===s.assignment_id)
      if (a?.class_id !== filterClass) return false
    }
    return true
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">داشبورد معلم</h1><p className="text-sm text-muted-foreground">مدیریت کلاس‌ها، تکالیف و تصحیح ارسال‌ها — {user?.email || ""}</p></div>
        <div className="flex gap-2">
          {(["classes","assignments","submissions"] as Tab[]).map(t=>(
            <Button key={t} variant={tab===t ? "default" : "outline"} size="sm" onClick={()=>setTab(t)}>
              {t==="classes" ? "کلاس‌ها" : t==="assignments" ? "تکالیف" : "ارسال‌ها"}
            </Button>
          ))}
        </div>
      </div>

      {tab==="classes" && (
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <Card className="md:col-span-1 h-fit">
            <CardHeader><CardTitle>کلاس جدید</CardTitle><CardDescription>کد کلاس به‌صورت خودکار ساخته می‌شود</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={createClass} className="space-y-3">
                <div className="space-y-1"><Label>نام کلاس</Label><Input value={className} onChange={e=>setClassName(e.target.value)} placeholder="مثلاً هنر هشتم - گروه A" required /></div>
                <div className="space-y-1"><Label>درس</Label><Input value={subject} onChange={e=>setSubject(e.target.value)} /></div>
                <Button type="submit" className="w-full">ساخت کلاس</Button>
              </form>
            </CardContent>
          </Card>
          <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
            {classes.length===0 && <Card><CardContent className="p-6 text-sm text-muted-foreground">هنوز کلاسی نساخته‌اید.</CardContent></Card>}
            {classes.map(c=>(
              <Card key={c.id}>
                <CardHeader><CardTitle className="flex justify-between items-center">{c.class_name} <Badge variant="secondary">{c.subject}</Badge></CardTitle><CardDescription>کد کلاس: <span className="font-mono font-bold tracking-widest text-foreground" dir="ltr">{c.class_code}</span> — اشتراک‌گذاری با دانش‌آموزان</CardDescription></CardHeader>
                <CardContent className="text-xs text-muted-foreground">ساخته شده: {new Date(c.created_at).toLocaleDateString("fa-IR")}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab==="assignments" && (
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <Card className="md:col-span-1 h-fit">
            <CardHeader><CardTitle>تکلیف جدید</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={createAssignment} className="space-y-3">
                <div className="space-y-1"><Label>کلاس</Label>
                  <Select value={assignClass} onChange={e=>setAssignClass(e.target.value)} required>
                    <option value="">انتخاب کنید</option>
                    {classes.map(c=> <option key={c.id} value={c.id}>{c.class_name} ({c.class_code})</option>)}
                  </Select>
                </div>
                <div className="space-y-1"><Label>عنوان</Label><Input value={assignTitle} onChange={e=>setAssignTitle(e.target.value)} required /></div>
                <div className="space-y-1"><Label>توضیحات / معیار نمره‌دهی</Label><Textarea value={assignDesc} onChange={e=>setAssignDesc(e.target.value)} placeholder="مثلاً: طراحی طبیعت بی‌جان، سایه‌روشن..." /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label>مهلت</Label><Input type="datetime-local" value={assignDue} onChange={e=>setAssignDue(e.target.value)} /></div>
                  <div className="space-y-1"><Label>سقف نمره</Label><Input type="number" value={assignMax} onChange={e=>setAssignMax(parseInt(e.target.value)||20)} /></div>
                </div>
                <div className="space-y-1"><Label>دسته</Label>
                  <Select value={assignCat} onChange={e=>setAssignCat(e.target.value as any)}>
                    <option value="regular">عادی</option><option value="midterm">میان‌ترم</option><option value="final">پایانی</option>
                  </Select>
                </div>
                <Button type="submit" className="w-full">ایجاد تکلیف</Button>
              </form>
            </CardContent>
          </Card>
          <div className="md:col-span-2 space-y-3">
            {assignments.length===0 && <Card><CardContent className="p-6 text-sm text-muted-foreground">تکلیفی ثبت نشده.</CardContent></Card>}
            {assignments.map(a=>{
              const cls = classes.find(c=>c.id===a.class_id)
              return (
                <Card key={a.id}>
                  <CardHeader><CardTitle className="flex gap-2 items-center">{a.title} <Badge variant="outline">{CATEGORY_LABEL[a.category]}</Badge> <Badge variant="secondary">{cls?.class_name || ""}</Badge></CardTitle>
                    <CardDescription>{a.description || "—"} — مهلت: {a.due_date ? new Date(a.due_date).toLocaleDateString("fa-IR") : "بدون مهلت"} — سقف: {a.max_score}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {tab==="submissions" && (
        <div className="mt-6 space-y-4">
          <Card>
            <CardContent className="p-4 flex flex-wrap gap-3 items-end">
              <div className="space-y-1"><Label>وضعیت</Label>
                <Select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                  <option value="all">همه</option><option value="submitted">نیاز به تصحیح</option><option value="graded">تصحیح‌شده</option><option value="late">دیرکرد</option>
                </Select>
              </div>
              <div className="space-y-1"><Label>کلاس</Label>
                <Select value={filterClass} onChange={e=>setFilterClass(e.target.value)}>
                  <option value="all">همه کلاس‌ها</option>
                  {classes.map(c=> <option key={c.id} value={c.id}>{c.class_name}</option>)}
                </Select>
              </div>
              <div className="mr-auto text-sm text-muted-foreground">{filteredSubs.length} ارسال</div>
            </CardContent>
          </Card>

          {filteredSubs.length===0 && <Card><CardContent className="p-6 text-sm text-muted-foreground">ارسالی با این فیلتر یافت نشد.</CardContent></Card>}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredSubs.map(s=>{
              const a = assignments.find(x=>x.id===s.assignment_id)
              return (
                <Card key={s.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex flex-wrap gap-2 items-center">
                      {a?.title || s.assignment_title || "تکلیف"}
                      <Badge variant={s.status==="graded" ? "success" : s.status==="late" ? "warning" : "secondary"}>{(STATUS_LABEL as any)[s.status] || s.status}</Badge>
                      {s.grade != null && <Badge variant="outline">نمره: {String(s.grade)}/{a?.max_score || 20}</Badge>}
                    </CardTitle>
                    <CardDescription>دانش‌آموز: {s.student_name || s.student_id.slice(0,8)} — {new Date(s.submitted_at).toLocaleDateString("fa-IR")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {s.student_notes && <p className="text-sm bg-muted p-2 rounded-md">یادداشت: {s.student_notes}</p>}
                    {s.file_urls?.length ? (
                      <div className="grid grid-cols-2 gap-2">
                        {s.file_urls.map((url,i)=>(
                          url.startsWith("data:") || url.match(/\.(png|jpe?g|webp|gif)$/i) || url.startsWith("blob:") ?
                            <img key={i} src={url} alt="ارسال" className="h-32 w-full object-cover rounded-md border" /> :
                            <a key={i} href={url} target="_blank" className="text-sm text-primary underline p-2 border rounded-md">مشاهده فایل {i+1}</a>
                        ))}
                      </div>
                    ) : <p className="text-xs text-muted-foreground">بدون فایل</p>}
                    <Separator />
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1"><Label>نمره</Label><Input type="number" step="0.5" placeholder="مثلاً 17" value={gradeInputs[s.id]?.grade ?? (s.grade ?? "") as any} onChange={e=> setGradeInputs(p=> ({...p, [s.id]: { grade: e.target.value, feedback: p[s.id]?.feedback ?? s.teacher_feedback ?? "" }}))} /></div>
                        <div className="flex items-end"><Button onClick={()=>saveGrade(s)} className="w-full">ذخیره نمره</Button></div>
                      </div>
                      <div className="space-y-1"><Label>بازخورد</Label><Textarea placeholder="نظر معلم..." value={gradeInputs[s.id]?.feedback ?? s.teacher_feedback ?? ""} onChange={e=> setGradeInputs(p=> ({...p, [s.id]: { grade: p[s.id]?.grade ?? (s.grade ?? "") as any, feedback: e.target.value }}))} /></div>
                      {s.teacher_feedback && <p className="text-xs text-muted-foreground">بازخورد ثبت‌شده: {s.teacher_feedback}</p>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <Card>
            <CardContent className="p-4 text-xs text-muted-foreground">نکته: با فیلتر «نیاز به تصحیح» فقط ارسال‌های تصحیح‌نشده را ببینید — مناسب تصحیح سریع با کیبورد.</CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
