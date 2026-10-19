"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Select, Label, Input, Textarea, Separator } from "@/components/ui/primitives"
import { createClient } from "@/lib/supabase/client"
import { STATUS_LABEL } from "@/lib/types"

export default function SubmissionsPage(){
  // reuse teacher submissions with dedicated route - redirect to teacher tab
  if (typeof window !== "undefined") window.location.replace("/teacher")
  return <div className="p-8 text-center text-sm text-muted-foreground">در حال انتقال به داشبورد...</div>
}
