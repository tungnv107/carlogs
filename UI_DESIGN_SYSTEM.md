# CarLog Design System — 2026.10

**Art direction:** Premium automotive-finance SaaS. Gọn, đáng tin cậy, dễ đọc dữ liệu tiền và thao tác bằng một tay. Nâng chất lượng bằng typography, bố cục và mật độ thông tin; dùng màu nhấn có chủ đích.

## 1. Foundation

| Token | Giá trị | Ứng dụng |
|---|---|---|
| `--brand` | `#153C88` | Nhận diện CarLog, navigation, chi tiết quan trọng |
| `--primary` | `#2563EB` | CTA, link, focus điều hướng |
| `--teal` | `#0D9488` | Điểm nhấn, eyebrow tích cực |
| `--canvas` | `#F6F8FC` | Nền ứng dụng |
| `--surface` | `#FFFFFF` | Thẻ và form |
| `--ink` | `#17253B` | Nội dung chính |
| `--muted` | `#66758C` | Nội dung phụ |
| `--stroke` | `#E4EAF2` | Divider, viền |
| `--success` | `#059669` | Hoàn tất/còn hạn |
| `--warning` | `#D97706` | Sắp đến hạn |
| `--danger` | `#DC2626` | Quá hạn, lỗi, hành động nguy hiểm |

Nguồn định nghĩa: `app/globals.css`, `tailwind.config.ts`. Không tạo màu ngẫu nhiên cho từng danh mục hay dùng nhiều gradient/shadow. Phân tầng dựa trên khoảng trắng, border nhạt, nhóm nội dung.

## 2. Typography, kích thước, spacing

- **Font:** `Be Vietnam Pro`, dự phòng `Inter`, `ui-sans-serif`, `system-ui`; đầy đủ dấu tiếng Việt.
- **Tiêu đề trang:** 23–30px, weight 800, line-height 1.28; **tiêu đề section:** 17px/700; **body:** 14–16px; **label và caption:** 12–13px.
- **Số tiền/KPI:** `font-variant-numeric: tabular-nums`, weight 700–800, `overflow-wrap: anywhere` để chứa VND dài trên màn hình hẹp.
- **Spacing:** đơn vị cơ sở 4px; khoảng cách giữa section 16–24px mobile, 24–32px desktop; padding card 16px mobile và 20px desktop.
- **Corners:** card 16–18px, input/button ~12px, badge pill; viền 1px, bóng rất nhẹ.
- **Controls:** chiều cao tối thiểu 44px, input 46px; `focus-visible` viền xanh 3px, trạng thái disabled rõ; đủ chạm trên mobile.

## 3. Pattern bắt buộc

| Pattern | File | Quy tắc sử dụng |
|---|---|---|
| `AppShell` | `components/layout/app-shell.tsx` | Desktop sidebar 254–264px, topbar, giới hạn nội dung 1440px; tổ chức/đăng xuất thực |
| Navigation | `components/layout/active-navigation.tsx` | Active theo URL, bottom navigation hiển thị dưới 768px; icon Lucide |
| `PageHeader` | `components/ui/page-header.tsx` | Eyebrow → tiêu đề → chú giải → CTA, không quá một primary CTA |
| `StatCard` | `components/ui/page-header.tsx` | Một hero KPI chính, chỉ số phụ cô đọng; `VND` đọc được trên 360px |
| `FilterDrawer` | `components/ui/filter-drawer.tsx` | Desktop filter form inline; mobile native dialog dạng bottom sheet, cùng GET logic |
| Charts | `components/reports/*-chart.tsx` | Nguồn `reportingService`, thang tiền/km chính xác, empty state, nhãn không tràn |
| `ExpenseForm` | `components/forms/expense-form.tsx` | Chọn xe → danh mục → VND; camera receipt, lưu thật, feedback và chống gửi lặp |
| `VehiclePicker` | `components/forms/vehicle-picker.tsx` | Search chọn xe từ danh sách người dùng được phép |

**Trạng thái hệ thống:** `app/(protected)/loading.tsx` sử dụng skeleton; `error.tsx` retry có hiệu lực; `app/not-found.tsx` cung cấp lối về tổng quan; trang dữ liệu trống có giải thích và CTA có quyền.

## 4. Responsive & mobile

- **Dưới 768px:** nội dung một cột, bottom nav + `safe-area-inset-bottom`, danh sách chuyển thành transaction cards, chart rộng 100%, thao tác chính dễ chạm.
- **Từ 768px:** sidebar cố định, filter inline, form tối đa hai cột; biểu đồ 2 cột nếu còn đủ không gian.
- **Từ 1024px:** dashboard phân cấp cột chính/phụ; tránh làm biểu đồ và nhắc hạn cùng kích thước vô nghĩa.
- **1440px trở lên:** content max-width 1440px, khoảng trống ổn định; không kéo dài dòng văn bản hết màn hình.
- **Viewport cần nghiệm thu thực:** 360, 390, 430, 768, 1024, 1440, 1920px; Chrome Android, Safari iOS và desktop.
- **Bộ lọc điện thoại:** modal native có backdrop và Escape, reset URL, submit GET; scroll nội dung sheet, không khóa chức năng khác sau khi đóng.

## 5. Accessibility, dữ liệu và quyền

- Labels thực tế cho mọi input; text lỗi dùng `role="alert"`; trạng thái tải dùng `aria-busy`; vùng điều hướng có tên rõ.
- Tương phản text cao; focus keyboard luôn hiện; `prefers-reduced-motion` tắt chuyển động không cần thiết.
- Không hiển thị `0 km`, `0 L/100km`, `0% biến động` như kết quả tính khi thiếu mẫu; viết **“Chưa đủ dữ liệu”**.
- Locale `vi-VN`, timezone `Asia/Ho_Chi_Minh`, tiền nguyên VND và sổ `POSTED` là nguồn tổng hợp.
- UI quyền chỉ là lớp trình bày; mọi mutation/export/query tiếp tục kiểm soát server authorization và organization scope.
- Không thêm dữ liệu demo, widget tĩnh giả số liệu hay CTA không nối chức năng.
- Đổi không gian làm việc từ trang Tài khoản cả trên mobile, submit `switchOrganization` có xác minh membership ở server; menu di động mở trang Tài khoản chứa các đường dẫn nghiệp vụ ít dùng.

## 5.1. PWA và trạng thái ngoại tuyến

- `public/manifest.webmanifest`: tên CarLog, standalone và màu thương hiệu; icon SVG hiện hữu.
- `public/sw.js`: cache có version cho tệp `/_next/static/`, icon, manifest và `offline.html`; tuyệt đối không cache API, kết quả POST, trang riêng đã đăng nhập, tài liệu, ảnh hóa đơn.
- Khi điều hướng mất mạng, trình duyệt có service worker đã cài đặt sẽ hiển thị `offline.html`; nút **Thử tải lại** chỉ reload khi mạng hoạt động. Thanh trạng thái trong ứng dụng hiển thị khi `navigator.onLine` báo ngoại tuyến. Không xác nhận giao dịch được lưu khi mất kết nối.
- Đã kiểm thử chính sách cache bằng Node unit tests. Vẫn phải xác minh cài đặt PWA và chuyển trạng thái online/offline trên Chrome/Safari thiết bị thật.

## 6. Quy tắc phát triển tiếp

Khi bổ sung route, tái sử dụng các token/components, bảo đảm empty/error/loading và mobile trước khi thêm layout desktop. Tất cả thay đổi business logic cần test; mọi UI route cần browser screenshot và test tương tác mới được đánh dấu nghiệm thu. Dark mode và PWA nâng cao (offline sync, push) là backlog chưa được nghiệm thu.
