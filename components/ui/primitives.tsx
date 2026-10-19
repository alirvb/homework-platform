import * as React from "react"
import { cn } from "@/lib/utils"

export function Button({ className, variant="default", size="default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default"|"secondary"|"outline"|"ghost"|"destructive", size?: "default"|"sm"|"lg"|"icon" }) {
  const variants: Record<string,string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  }
  const sizes: Record<string,string> = {
    default: "h-10 px-4 py-2", sm: "h-8 px-3 text-sm", lg: "h-11 px-8", icon: "h-9 w-9",
  }
  return <button className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring", variants[variant], sizes[size], className)} {...props} />
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50")} {...props} />
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")} {...props} />
}
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium", className)} {...props} />
}
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)} {...props} />
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold", className)} {...props} />
}
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}
export function Badge({ className, variant="default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default"|"secondary"|"outline"|"success"|"warning"|"destructive" }) {
  const v: Record<string,string> = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border text-foreground",
    success: "bg-emerald-500 text-white",
    warning: "bg-amber-500 text-white",
    destructive: "bg-red-500 text-white",
  }
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", v[variant], className)} {...props} />
}
export function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shrink-0 bg-border h-[1px] w-full", className)} {...props} />
}
export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring", className)} {...props}>{children}</select>
}
