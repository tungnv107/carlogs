# CarLog — Premium Liquid Glass Design System

## Triết lý lớp bề mặt

1. **Atmosphere**: nền pearl blue/navy, radial light rất mờ, không có animation nền liên tục.
2. **Data surface**: `--surface-solid` hoặc `--surface-raised` giữ số, form, bảng và chart đọc được trên nền ổn định.
3. **Floating glass**: app topbar, bottom nav, dialog, filter sheet và một số toolbar; `backdrop-filter` có fallback.

## Tokens (`app/globals.css`)

| Semantic token | Light | Dark | Vai trò |
| --- | --- | --- | --- |
| `--page-bg` | `#f3f6fc` | `#081426` | Canvas |
| `--text-primary` | `#10223f` | `#f0f6ff` | Chữ chính |
| `--text-secondary` | `#586a84` | `#b1c0d5` | Mô tả, nhãn phụ |
| `--brand-primary` | `#2563eb` | `#6b9dff` | Active, CTA, links |
| `--brand-deep` | `#153c88` | `#98baff` | Chữ nhấn |
| `--accent-cyan` | `#53c5f7` | `#74d9ee` | Specular/accent |
| `--surface-solid` | `#ffffff` | `#111f35` | Content cards |
| `--surface-raised` | `#f8faff` | `#192b45` | Grouped content |
| `--glass-bg` | `rgba(255,255,255,.69)` | `rgba(19,37,64,.78)` | Floating controls |
| `--stroke-soft` | `#e2e9f4` | `#293b55` | Content borders |

Elevation dùng `--card-shadow`, `--glass-shadow`; radius card 22px, toolbar 22px, controls 13–14px, bottom nav 24px. Grid dựa 4/8px. Font `Be Vietnam Pro` với fallback hệ thống và `font-variant-numeric: tabular-nums` cho số tiền/km.

## Component conventions

- `PageHeader` và `StatCard`: cùng một thứ bậc heading/metric trên mọi trang.
- `.card`: nền đặc có stroke và elevation nhẹ; `.metric-hero`: một metric trọng tâm dùng nền blue gradient sâu.
- `.app-topbar`, `.mobile-glass-nav`, `.mobile-filter-sheet`: kính nổi, specular inner border, shadow, `blur(24px) saturate(...)` khi được hỗ trợ.
- `.btn` (primary) và `.btn-secondary` (subtle glass): trạng thái hover/active/focus rõ, không phụ thuộc màu duy nhất để mô tả hành động.
- `.amount-well`: nhập VND lớn, số có độ tương phản; `.form-submit-sticky`: lưu ở gần tay trên mobile.
- `.transaction-row`, `.vehicle-tile`, `.chart-card`: rõ thứ bậc, tăng cảm giác thao tác mà không blur nội dung.
- `FilterDrawer`: accordion desktop/managed dialog mobile; native focus và Escape support.
- `.badge-*`: success/warning/danger/neutral có cả nhãn chữ.

## Theme, motion và accessibility

Theme chọn bởi `ThemeToggle`, lưu `localStorage`, được áp dụng sớm trong `app/layout.tsx`; CSS dùng `:root[data-theme="dark"]`. Với trình duyệt không hỗ trợ `backdrop-filter`, màu nền tương đối đặc vẫn sử dụng được. `prefers-reduced-transparency: reduce` tắt blur ở floating controls. `prefers-reduced-motion: reduce` rút ngắn animation/transition; focus outline 3px ở button/link/input/select/textarea/summary. Input tối thiểu 46px, nav/touch targets tối thiểu khoảng 44px. Safe area qua `env(safe-area-inset-bottom)`; nội dung có padding đáy bổ sung dưới bottom nav.

## Nonvisual invariants

Giữ route, form `name`, actions, dữ liệu Prisma, guard role, Google OAuth, report/export endpoints, receipt upload và text tiếng Việt. Không thay số liệu bằng placeholder hoặc dữ liệu giả. Báo cáo PDF/in sử dụng CSS print, không áp dụng blur lên số liệu.
