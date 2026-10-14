"use client";

import { useEffect, useState } from "react";

/** Opens the adjacent native details form from a row-level edit button. */
export function OpenEditButton({ detailsId }: { detailsId: string }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const details = document.getElementById(detailsId) as HTMLDetailsElement | null;
    if (!details) return;
    const sync = () => setExpanded(details.open);
    details.addEventListener("toggle", sync);
    sync();
    return () => details.removeEventListener("toggle", sync);
  }, [detailsId]);

  return <button type="button" className="btn-secondary" aria-controls={detailsId} aria-expanded={expanded} onClick={() => {
    const details = document.getElementById(detailsId) as HTMLDetailsElement | null;
    if (!details) return;
    details.open = !details.open;
    if (details.open) details.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }}>{expanded ? "Đóng sửa ↑" : "Sửa ↓"}</button>;
}
