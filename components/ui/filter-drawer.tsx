"use client";

import type { ReactNode, MouseEvent } from "react";
import { useRef } from "react";
import Link from "next/link";
import { Filter, SlidersHorizontal, X } from "lucide-react";

/** Native modal dialog on phones; the same real GET form stays inline on desktop. */
export function FilterDrawer({ title, children, resetHref }: { title: string; children: ReactNode; resetHref: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialog.current) dialog.current?.close();
  };

  return <>
    <section aria-label={title} className="card hidden md:block">{children}</section>
    <div className="md:hidden">
      <button type="button" className="btn-secondary w-full justify-between" onClick={() => dialog.current?.showModal()}>
        <span className="flex items-center gap-2"><SlidersHorizontal size={18}/>{title}</span><Filter size={17}/>
      </button>
      <dialog ref={dialog} onClick={closeBackdrop} aria-label={title} className="mobile-filter-dialog">
        <section className="mobile-filter-sheet" role="document">
          <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300"/>
          <header className="mb-5 flex items-center justify-between gap-3">
            <div><p className="eyebrow">TÌM KIẾM & LỌC</p><h2 className="mt-1 text-lg font-extrabold">{title}</h2></div>
            <button type="button" onClick={() => dialog.current?.close()} className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100" aria-label="Đóng bộ lọc"><X size={21}/></button>
          </header>
          <div className="mobile-filter-content">{children}</div>
          <Link href={resetHref} className="mt-3 flex min-h-11 items-center justify-center text-sm font-semibold text-blue-700" onClick={() => dialog.current?.close()}>Xóa tất cả bộ lọc</Link>
        </section>
      </dialog>
    </div>
  </>;
}
