# Wireframe và navigation (P0-06)

Desktop: sidebar **Tổng quan / Phương tiện / Chi phí / (sau MVP: Nhiên liệu, Hành trình, Bảo dưỡng, Báo cáo) / Tài khoản**. Topbar tên/ảnh Google, workspace và logout. Mobile bottom nav **Tổng quan · Phương tiện · + Chi phí · Lịch sử · Menu**, vùng bấm tối thiểu 44px và hỗ trợ safe-area.

```text
Dashboard 360px         Danh sách xe 360px       Thêm chi phí 360px
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│ Tên app    Avatar │   │ ← Xe      + Thêm  │   │ ← Thêm chi phí    │
│ Chi phí tháng này │   │ [Tìm biển số...]  │   │ Xe    [Chọn  ▾]  │
│  ... ₫ (DB)       │   │ [Card xe + status]│   │ Tiền [        ]  │
│ Xe / giao dịch    │   │ [Card xe + status]│   │ Ngày [        ]  │
│ Giao dịch gần đây │   │                   │   │ Loại [        ▾] │
│ [+ Thêm chi phí]  │   │                   │   │ Ghi chú [     ]  │
│ [Bottom nav]      │   │ [Bottom nav]      │   │ [Lưu] [Lưu tiếp] │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```

Luồng: Login → onboarding → Dashboard → tạo xe → thêm chi phí → lịch sử. Form 1 cột, `inputMode=numeric`, `vi-VN`, lỗi tại trường và giữ dữ liệu khi network fail. Responsive 360/390/430/768/1366/1920px, cards trên mobile và table trên desktop; không overflow ngang.
