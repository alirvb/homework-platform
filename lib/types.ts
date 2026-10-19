export type Role = 'teacher' | 'student'
export type Category = 'regular' | 'midterm' | 'final'
export type SubmissionStatus = 'submitted' | 'graded' | 'late'

export interface Profile { user_id: string; full_name: string; role: Role; avatar_url?: string }
export interface ClassItem { id: string; teacher_id: string; class_name: string; subject: string; class_code: string; created_at: string }
export interface Enrollment { id: string; class_id: string; student_id: string; enrolled_at: string }
export interface Assignment { id: string; class_id: string; title: string; description: string; due_date: string; max_score: number; category: Category; created_at: string }
export interface Submission { id: string; assignment_id: string; student_id: string; file_urls: string[]; student_notes: string; status: SubmissionStatus; grade: number | null; teacher_feedback: string; submitted_at: string; graded_at: string | null }

export const CATEGORY_LABEL: Record<Category,string> = { regular: 'عادی', midterm: 'میان‌ترم', final: 'پایانی' }
export const STATUS_LABEL: Record<SubmissionStatus,string> = { submitted: 'تحویل داده', graded: 'تصحیح شد', late: 'دیرکرد' }
