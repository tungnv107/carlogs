export type InstallEnvironment = "ios-safari" | "ios-other" | "android" | "android-in-app" | "other";

/** Choose installation instructions from browser capabilities and the device. */
export function getInstallEnvironment(userAgent: string, platform = "", touchPoints = 0): InstallEnvironment {
  const ios = /iPad|iPhone|iPod/i.test(userAgent) || (platform === "MacIntel" && touchPoints > 1);
  const embedded = /FBAN|FBAV|Instagram|Zalo|Line\/|; wv\)|\bwv\b/i.test(userAgent);

  if (ios) {
    const safari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
    return safari && !embedded ? "ios-safari" : "ios-other";
  }
  if (/Android/i.test(userAgent)) return embedded ? "android-in-app" : "android";
  return "other";
}

export function getInstallInstructions(environment: Exclude<InstallEnvironment, "other">): string[] {
  switch (environment) {
    case "ios-safari":
      return [
        "Nhấn Chia sẻ (biểu tượng ô vuông có mũi tên hướng lên) trong Safari.",
        "Cuộn xuống và chọn “Thêm vào Màn hình chính”.",
        "Nhấn “Thêm” để tạo biểu tượng CarLog trên màn hình chính."
      ];
    case "ios-other":
      return [
        "Mở trang CarLog này bằng Safari trên iPhone hoặc iPad.",
        "Nhấn Chia sẻ (biểu tượng ô vuông có mũi tên hướng lên).",
        "Chọn “Thêm vào Màn hình chính”, sau đó nhấn “Thêm”."
      ];
    case "android-in-app":
      return [
        "Mở trang này bằng Chrome: chọn “Mở bằng trình duyệt” trong menu ứng dụng, hoặc sao chép liên kết và dán vào Chrome.",
        "Nhấn menu ⋮ của Chrome và chọn “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”.",
        "Nhấn “Cài đặt” hoặc “Thêm” để xác nhận."
      ];
    case "android":
      return [
        "Trong Chrome, nhấn menu ⋮ ở góc trên bên phải.",
        "Chọn “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”.",
        "Nhấn “Cài đặt” hoặc “Thêm” để xác nhận."
      ];
  }
}
