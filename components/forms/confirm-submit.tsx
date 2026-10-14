"use client";

export function ConfirmSubmit({ prompt, children }: { prompt: string; children: React.ReactNode }) {
  return <button type="submit" className="btn-secondary text-red-700"
    onClick={(event) => { if (!window.confirm(prompt)) event.preventDefault(); }}>{children}</button>;
}
