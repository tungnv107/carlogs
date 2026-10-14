"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { formatVndDigits, normalizeVndDigits, vndCaretPosition } from "@/lib/vnd-input";

/** Display Vietnamese grouping while submitting exact digits to the server. */
export function VndAmountInput({ initialDigits = "" }: { initialDigits?: string }) {
  const [digits, setDigits] = useState(() => normalizeVndDigits(initialDigits));
  const inputRef = useRef<HTMLInputElement>(null);
  const requestedCaret = useRef<number | null>(null);
  const display = formatVndDigits(digits);

  useLayoutEffect(() => {
    if (requestedCaret.current === null || !inputRef.current) return;
    inputRef.current.setSelectionRange(requestedCaret.current, requestedCaret.current);
    requestedCaret.current = null;
  }, [digits]);

  return <div className="relative">
    <input
      ref={inputRef}
      aria-label="Số tiền (VND)"
      required
      type="text"
      inputMode="numeric"
      pattern="[0-9.]+"
      autoComplete="off"
      value={display}
      onChange={(event) => {
        const raw = event.target.value;
        const next = normalizeVndDigits(raw);
        requestedCaret.current = vndCaretPosition(raw, event.target.selectionStart ?? raw.length, next);
        setDigits(next);
      }}
      placeholder="150.000"
      className="money amount-input pr-14 text-2xl font-extrabold"
    />
    <input type="hidden" name="amount" value={digits} />
    <span className="absolute right-4 top-4 font-semibold text-[var(--muted)]">đ</span>
  </div>;
}
