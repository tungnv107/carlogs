"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function ReceiptInput() {
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  const setReceipt = (next: File | null) => {
    const message = next && !ALLOWED_TYPES.includes(next.type)
      ? "Chỉ hỗ trợ ảnh JPEG, PNG, WebP hoặc tệp PDF."
      : next && next.size > MAX_RECEIPT_BYTES
        ? "Tệp vượt quá 5 MB, hãy chọn tệp nhỏ hơn hoặc bỏ tệp này."
        : "";
    setFile(next);
    setError(message);
    fileInput.current?.setCustomValidity(message);
  };

  const clearReceipt = () => {
    if (fileInput.current) fileInput.current.value = "";
    if (cameraInput.current) cameraInput.current.value = "";
    setReceipt(null);
  };

  const attachCameraPhoto = (photo: File | null) => {
    if (!photo || !fileInput.current) return;
    try {
      // The named file input remains the sole uploaded field for the server action.
      const transfer = new DataTransfer();
      transfer.items.add(photo);
      fileInput.current.files = transfer.files;
      setReceipt(photo);
    } catch {
      setError("Không thể đính kèm ảnh chụp. Hãy chọn ảnh từ thư viện để thử lại.");
      if (fileInput.current) fileInput.current.setCustomValidity("Không thể đính kèm ảnh.");
    }
  };

  useEffect(() => {
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <div className="space-y-3">
    <label className="block">
      <span className="label">Ảnh hóa đơn / PDF (không bắt buộc, tối đa 5 MB)</span>
      <input ref={fileInput} name="receipt" type="file" accept={ALLOWED_TYPES.join(",")}
        onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} aria-invalid={!!error} />
    </label>
    <input ref={cameraInput} className="sr-only" tabIndex={-1} aria-hidden="true"
      type="file" accept="image/*" capture="environment" onChange={(event) => attachCameraPhoto(event.target.files?.[0] ?? null)} />
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn-secondary" onClick={() => cameraInput.current?.click()}>
        <Camera size={18} aria-hidden="true"/>Chụp hóa đơn
      </button>
      {file && <button type="button" className="btn-secondary" onClick={clearReceipt}>
        <X size={17} aria-hidden="true"/>Bỏ tệp đã chọn
      </button>}
    </div>
    {file && <p className="muted break-all">Đã chọn: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {preview && <Image unoptimized src={preview} alt="Xem trước ảnh hóa đơn" width={320} height={240}
      className="max-h-60 w-auto max-w-full rounded-lg border object-contain" />}
  </div>;
}
