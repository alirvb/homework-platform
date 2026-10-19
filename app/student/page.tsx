"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Badge, Separator } from "@/components/ui/primitives"
import { createClient } from "@/lib/supabase/client"
import type { ClassItem, Assignment, Submission } from "@/lib/types"
import { CATEGORY_LABEL } from "@/lib/types"

export default function StudentDashboard() {
  const demo = !process.env.NEXT_PUBLIC_SUPABASE_URL
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [classCode, setClassCode] = useState("")
  const [joinMsg, setJoinMsg] = useState("")
  const [uploadState, setUploadState] = useState<Record<string,{notes:string, files: File[], uploading:boolean, msg:string}>>({})
  const [filter, setFilter] = useState<"all"|"pending"|"submitted">("all")

  const load = async () => {
    if (demo) {
      const sess = JSON.parse(localStorage.getItem("demo_session")||"null"); setUser(sess)
      if (!sess) return
      const allClasses: ClassItem[] = JSON.parse(localStorage.getItem("demo_classes")||"[]")
      const enrolls: any[] = JSON.parse(localStorage.getItem("demo_enrollments")||"[]")
      const myClassIds = enrolls.filter(e=>e.student_id===sess.id).map(e=>e.class_id)
      const myClasses = allClasses.filter(c=> myClassIds.includes(c.id))
      setClasses(myClasses)
      const allAssigns: Assignment[] = JSON.parse(localStorage.getItem("demo_assignments")||"[]")
      setAssignments(allAssigns.filter(a=> myClassIds.includes(a.class_id)))
      const allSubs: Submission[] = JSON.parse(localStorage.getItem("demo_submissions")||"[]")
      setSubmissions(allSubs.filter(s=> s.student_id===sess.id))
      return
    }
    const supa = createClient()
    const { data: { user: u } } = await supa.auth.getUser(); setUser(u)
    if (!u) return
    const { data: enrolls } = await supa.from("class_enrollments").select("class_id").eq("student_id", u.id)
    const ids = (enrolls||[]).map(e=>e.class_id)
    if (ids.length) {
      const { data: cls } = await supa.from("classes").select("*").in("id", ids); setClasses((cls as any)||[])
      const { data: assigns } = await supa.from("assignments").select("*").in("class_id", ids).order("due_date", {ascending:true}); setAssignments((assigns as any)||[])
      const { data: subs } = await supa.from("submissions").select("*").eq("student_id", u.id); setSubmissions((subs as any)||[])
    }
  }
  useEffect(()=>{ load() }, [])

  const joinClass = async (e: React.FormEvent) => {
    e.preventDefault(); setJoinMsg("")
    const code = classCode.trim().toUpperCase(); if (!code) return
    if (demo) {
      const allClasses: ClassItem[] = JSON.parse(localStorage.getItem("demo_classes")||"[]")
      const cls = allClasses.find(c=>c.class_code===code)
      if (!cls) { setJoinMsg("کد کلاس یافت نشد"); return }
      const sess = JSON.parse(localStorage.getItem("demo_session")||"{}")
      const enrolls: any[] = JSON.parse(localStorage.getItem("demo_enrollments")||"[]")
      if (enrolls.some(en=>en.class_id===cls.id && en.student_id===sess.id)) { setJoinMsg("قبلاً عضو این کلاس هستید"); return }
      enrolls.push({ id: Math.random().toString(36).slice(2), class_id: cls.id, student_id: sess.id, enrolled_at: new Date().toISOString() })
      localStorage.setItem("demo_enrollments", JSON.stringify(enrolls)); setClassCode(""); setJoinMsg("با موفقیت عضو شدید!"); load(); return
    }
    const supa = createClient()
    const { data: cls } = await supa.from("classes").select("id").eq("class_code", code).single()
    if (!cls) { setJoinMsg("کد کلاس یافت نشد"); return }
    const { data: { user: u } } = await supa.auth.getUser()
    if (!u) return
    const { error } = await supa.from("class_enrollments").insert({ class_id: cls.id, student_id: u.id })
    if (error) setJoinMsg(error.message.includes("duplicate") ? "قبلاً عضو هستید" : error.message)
    else { setJoinMsg("عضویت انجام شد"); setClassCode(""); load() }
  }

  const submitAssignment = async (assignment: Assignment) => {
    const st = uploadState[assignment.id]; if (!st) return
    setUploadState(p=> ({...p, [assignment.id]: {...p[assignment.id], uploading: true, msg: ""}}))
    try {
      const fileUrls: string[] = []
      if (demo) {
        // convert to data urls for preview
        for (const f of st.files) {
          const dataUrl = await new Promise<string>((res,rej)=>{
            const r = new FileReader(); r.onload=()=>res(r.result as string); r.onerror=rej; r.readAsDataURL(f)
          })
          fileUrls.push(dataUrl)
        }
        const sess = JSON.parse(localStorage.getItem("demo_session")||"{}")
        const isLate = assignment.due_date ? new Date() > new Date(assignment.due_date) : false
        const sub: Submission = { id: Math.random().toString(36).slice(2), assignment_id: assignment.id, student_id: sess.id, file_urls: fileUrls, student_notes: st.notes, status: isLate ? "late" : "submitted", grade: null, teacher_feedback: "", submitted_at: new Date().toISOString(), graded_at: null }
        const all: Submission[] = JSON.parse(localStorage.getItem("demo_submissions")||"[]")
        // upsert
        const idx = all.findIndex(x=> x.assignment_id===assignment.id && x.student_id===sess.id)
        if (idx>=0) all[idx]=sub; else all.push(sub)
        localStorage.setItem("demo_submissions", JSON.stringify(all))
        setUploadState(p=> ({...p, [assignment.id]: {notes:"", files:[], uploading:false, msg:"ارسال شد ✓"}}))
        load(); return
      }
      const supa = createClient()
      const { data: { user: u } } = await supa.auth.getUser(); if (!u) throw new Error("وارد شوید")
      for (const f of st.files) {
        const path = `${u.id}/${assignment.id}/${Date.now()}_${f.name}`
        const { error } = await supa.storage.from("homework-files").upload(path, f)
        if (error) throw error
        const { data } = supa.storage.from("homework-files").getPublicUrl(path)
        fileUrls.push(data.publicUrl)
      }
      const isLate = assignment.due_date ? new Date() > new Date(assignment.due_date) : false
      const { error } = await supa.from("submissions").upsert({ assignment_id: assignment.id, student_id: u.id, file_urls: fileUrls, student_notes: st.notes, status: isLate ? "late" : "submitted", submitted_at: new Date().toISOString() }, { onConflict: "assignment_id,student_id" })
      if (error) throw error
      setUploadState(p=> ({...p, [assignment.id]: {notes:"", files:[], uploading:false, msg:"ارسال شد ✓"}}))
      load()
    } catch (e:any) {
      setUploadState(p=> ({...p, [assignment.id]: {...p[assignment.id], uploading:false, msg: e.message || "خطا در ارسال"}}))
    }
  }

  const getSubmission = (aid: string) => submissions.find(s=> s.assignment_id===aid)

  const filtered = assignments.filter(a=>{
    if (filter==="all") return true
    const sub = getSubmission(a.id)
    if (filter==="pending") return !sub
    if (filter==="submitted") return !!sub
    return true
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">داشبورد دانش‌آموز</h1><p className="text-sm text-muted-foreground">تکالیف، ارسال و نمرات — {user?.email || ""}</p></div>
        <div className="flex gap-2">
          <Button variant={filter==="all"?"default":"outline"} size="sm" onClick={()=>setFilter("all")}>همه</Button>
          <Button variant={filter==="pending"?"default":"outline"} size="sm" onClick={()=>setFilter("pending")}>در انتظار</Button>
          <Button variant={filter==="submitted"?"default":"outline"} size="sm" onClick={()=>setFilter("submitted")}>ارسال‌شده</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>پیوستن به کلاس</CardTitle><CardDescription>کد ۶ حرفی که معلم به شما داده را وارد کنید</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={joinClass} className="flex gap-2 max-w-md">
            <Input value={classCode} onChange={e=>setClassCode(e.target.value.toUpperCase())} placeholder="مثلاً A3K9PQ" dir="ltr" className="font-mono tracking-widest" maxLength={6} />
            <Button type="submit">عضویت</Button>
          </form>
          {joinMsg && <p className="text-sm mt-2 text-primary">{joinMsg}</p>}
          {classes.length>0 && <div className="flex flex-wrap gap-2 mt-3">{classes.map(c=> <Badge key={c.id} variant="secondary">{c.class_name} — {c.class_code}</Badge>)}</div>}
        </CardContent>
      </Card>

      {filtered.length===0 ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">{assignments.length===0 ? "هنوز در کلاسی عضو نیستید یا تکلیفی وجود ندارد." : "تکلیفی با این فیلتر یافت نشد."}</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(a=>{
            const sub = getSubmission(a.id); const cls = classes.find(c=>c.id===a.class_id)
            const due = a.due_date ? new Date(a.due_date) : null
            const isOverdue = due ? new Date() > due : false
            const st = uploadState[a.id] || { notes:"", files:[], uploading:false, msg:"" }
            return (
              <Card key={a.id} className={isOverdue && !sub ? "border-amber-300 dark:border-amber-800" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex flex-wrap gap-2 items-center">{a.title} <Badge variant="outline">{CATEGORY_LABEL[a.category]}</Badge> {sub?.grade != null && <Badge variant="success">نمره: {sub.grade}/{a.max_score}</Badge>} {sub && <Badge variant={sub.status==="graded"?"success": sub.status==="late"?"warning":"secondary"}>{sub.status==="graded"?"تصحیح شد": sub.status==="late"?"دیرکرد":"تحویل داده"}</Badge>}</CardTitle>
                  <CardDescription>{cls?.class_name || ""} — مهلت: {due ? due.toLocaleDateString("fa-IR") : "—"} {isOverdue && !sub && " ⏰ مهلت گذشته"} — سقف {a.max_score}</CardDescription>
                  {a.description && <p className="text-sm mt-2 leading-relaxed">{a.description}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  {sub ? (
                    <div className="space-y-2">
                      <p className="text-sm">ارسال شما: {sub.file_urls?.length || 0} فایل — {new Date(sub.submitted_at).toLocaleDateString("fa-IR")}</p>
                      {sub.teacher_feedback && <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 rounded-md text-sm"><b>بازخورد معلم:</b> {sub.teacher_feedback}</div>}
                      {sub.file_urls?.length ? (
                        <div className="grid grid-cols-2 gap-2">
                          {sub.file_urls.map((url,i)=> url.startsWith("data:") || url.match(/\.(png|jpe?g|webp)/i) ? <img key={i} src={url} alt="ارسال" className="h-24 w-full object-cover rounded border" /> : <a key={i} href={url} target="_blank" className="text-xs text-primary underline">فایل {i+1}</a>)}
                        </div>
                      ) : null}
                      <Separator />
                      <p className="text-xs text-muted-foreground">ارسال مجدد: فایل‌های جدید جایگزین می‌شوند.</p>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <Label>یادداشت (اختیاری)</Label>
                    <Textarea placeholder="توضیح کوتاه..." value={st.notes} onChange={e=> setUploadState(p=> ({...p, [a.id]: {...(p[a.id]||{notes:"",files:[],uploading:false,msg:""}), notes: e.target.value}}))} />
                    <Label>فایل‌ها (تصویر / PDF)</Label>
                    <Input type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={e=> setUploadState(p=> ({...p, [a.id]: {...(p[a.id]||{notes:"",files:[],uploading:false,msg:""}), files: Array.from(e.target.files||[])}}))} />
                    {st.files.length>0 && <p className="text-xs text-muted-foreground">{st.files.length} فایل انتخاب شد</p>}
                    <Button onClick={()=>submitAssignment(a)} disabled={st.uploading || st.files.length===0} className="w-full">{st.uploading ? "در حال آپلود..." : sub ? "ارسال مجدد" : "ارسال تکلیف"}</Button>
                    {st.msg && <p className="text-sm text-primary">{st.msg}</p>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
