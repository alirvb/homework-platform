import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "سامانه مدیریت تکالیف | هنر",
  description: "پلتفرم مدیریت تکالیف برای معلمان و دانش‌آموزان - هنر",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`:root{--font-vazirmatn:'Vazirmatn',sans-serif} .font-vazir{font-family:var(--font-vazirmatn)}`}</style>
      </head>
      <body className="font-vazir min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
