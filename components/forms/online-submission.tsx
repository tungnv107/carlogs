"use client";

import { useState, type FormEvent } from "react";

/** Browser offline status is advisory; server actions still own persistence. */
export function useOnlineSubmission() {
  const [offlineError, setOfflineError] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const offline = !navigator.onLine;
    setOfflineError(offline);
    if (offline) event.preventDefault();
    return !offline;
  };

  return { offlineError, onSubmit };
}

export function OfflineNotice() {
  return <p role="alert" className="error">Bạn đang ngoại tuyến. Dữ liệu chưa được lưu; hãy kết nối mạng rồi gửi lại. Nội dung đã nhập vẫn được giữ trên biểu mẫu.</p>;
}
