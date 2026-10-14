import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarLog | Quản lý xe và chi phí",
  description: "Quản lý phương tiện và chi phí vận hành trên điện thoại.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "CarLog", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/logo.png", type: "image/png", sizes: "1254x1254" }],
    apple: [{ url: "/icons/logo.png", type: "image/png", sizes: "1254x1254" }]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('carlog-theme')||localStorage.getItem('xelog-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=t==='dark'||(!t&&m)?'dark':'light';document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme}catch(e){document.documentElement.dataset.theme='light'}` }} /></head><body className="min-h-screen antialiased">{children}</body></html>;
}
