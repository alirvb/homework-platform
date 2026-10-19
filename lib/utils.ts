import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function generateClassCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}
export function formatDateShort(date: string | Date) {
  return new Date(date).toLocaleDateString("fa-IR")
}
