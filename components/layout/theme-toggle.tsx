"use client";

import { useEffect, useState } from "react";
import { MoonStar, Sun } from "lucide-react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try { localStorage.setItem("carlog-theme", next); } catch { /* Storage can be restricted. */ }
    setTheme(next);
  };
  return <button type="button" onClick={toggle} className="icon-button" aria-label={theme === "light" ? "Bật giao diện tối" : "Bật giao diện sáng"} title={theme === "light" ? "Giao diện tối" : "Giao diện sáng"}>
    {theme === "light" ? <MoonStar size={19} strokeWidth={1.9}/> : <Sun size={19} strokeWidth={1.9}/>}
  </button>;
}
