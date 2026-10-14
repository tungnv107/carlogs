"use client";

import Image from "next/image";
import { Download, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getInstallEnvironment, getInstallInstructions, type InstallEnvironment } from "@/lib/pwa-install";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "carlog-install-dismissed-at";
const REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export function InstallAppPrompt() {
  const [environment, setEnvironment] = useState<InstallEnvironment>("other");
  const [visible, setVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const detected = getInstallEnvironment(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
    if (detected === "other") return;

    const standalone = window.matchMedia("(display-mode: standalone)");
    const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone.matches || iosStandalone) return;

    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY));
      if (dismissedAt > 0 && Date.now() - dismissedAt < REMIND_AFTER_MS) return;
    } catch { /* Private browsing or disabled storage: still allow the reminder. */ }

    setEnvironment(detected);
    setVisible(true);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    standalone.addEventListener?.("change", onInstalledIfStandalone);

    function onInstalledIfStandalone() {
      if (standalone.matches) onInstalled();
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      standalone.removeEventListener?.("change", onInstalledIfStandalone);
    };
  }, []);

  if (!visible || environment === "other") return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* Storage may be unavailable. */ }
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) {
      setShowGuide(true);
      return;
    }
    try {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === "accepted") setVisible(false);
      else setShowGuide(true);
    } catch {
      setShowGuide(true);
    } finally {
      setInstallEvent(null);
    }
  };

  const instructions = getInstallInstructions(environment);
  return <aside aria-label="Thêm CarLog vào màn hình chính" className="fixed inset-x-3 z-[60] mx-auto max-h-[min(70dvh,600px)] max-w-[430px] overflow-y-auto rounded-2xl border p-4 shadow-[0_18px_55px_rgba(12,35,78,.28)]" style={{ bottom: "calc(5.7rem + env(safe-area-inset-bottom))", background: "var(--surface-solid)", borderColor: "var(--stroke-soft)", color: "var(--text-primary)" }}>
    <div className="flex items-start gap-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: "var(--surface-raised)" }}><Image src="/icons/logo.png" alt="" width={42} height={42}/></div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-extrabold"><Smartphone size={17} aria-hidden="true"/> Thêm CarLog vào màn hình chính</p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>Mở nhanh CarLog như một ứng dụng trên điện thoại.</p>
      </div>
      <button type="button" onClick={dismiss} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" aria-label="Đóng lời nhắc cài ứng dụng" title="Để sau"><X size={18}/></button>
    </div>

    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className="btn !min-h-10 !py-2" onClick={install} aria-expanded={!installEvent ? showGuide : undefined} aria-controls={!installEvent ? "install-app-steps" : undefined}><Download size={16} aria-hidden="true"/>{installEvent ? "Cài ứng dụng" : "Xem cách thêm"}</button>
      {installEvent && <button type="button" className="btn-secondary !min-h-10 !py-2" aria-expanded={showGuide} aria-controls="install-app-steps" onClick={() => setShowGuide(value => !value)}>Hướng dẫn thủ công</button>}
      <button type="button" className="px-3 text-xs font-semibold underline underline-offset-4" onClick={dismiss} style={{ color: "var(--text-secondary)" }}>Để sau</button>
    </div>

    {showGuide && <section id="install-app-steps" className="mt-4 rounded-xl border p-3" style={{ background: "var(--surface-raised)", borderColor: "var(--stroke-soft)" }} aria-label="Các bước thêm ứng dụng">
      <p className="text-sm font-bold">Cách thêm vào màn hình chính</p>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-xs leading-relaxed">{instructions.map(step => <li key={step}>{step}</li>)}</ol>
    </section>}
  </aside>;
}
