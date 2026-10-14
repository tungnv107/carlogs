# CarLog — Premium Liquid Glass UI/UX rollout

Ngày kiểm kê: 14/10/2026. Phạm vi: Next.js 15 / React 19 / Tailwind 3, giao diện tiếng Việt. Tất cả số liệu vẫn lấy từ Prisma, báo cáo và server actions hiện có.

## A. Audit

- [x] Đọc đầy đủ `PROMPT_CARLOG_LIQUID_GLASS_REDESIGN.md`.
- [x] Kiểm kê màn hình, navigation, các biểu mẫu, dashboard, biểu đồ, auth và API.
- [x] Kiểm tra trạng thái Git: thư mục làm việc không có repository `.git` khả dụng; không thể tạo diff Git tại gốc.
- [x] Ghi nhận vấn đề: bố cục cũ thiếu thứ bậc, token ánh sáng/tối chưa đầy đủ, navigation mobile gắn đáy theo kiểu thông thường, dashboard và sổ chi phí chưa có cách trình bày fintech.
- [ ] Ảnh baseline có thể xác thực trước khi redesign (không có ảnh baseline đáng tin cậy cho mọi route).

## B. Design system và shell

- [x] Bộ token semantic light/dark, bề mặt đặc cho nội dung, kính cho controls nổi, viền phản chiếu và bóng đổ.
- [x] Theme toggle có lưu lựa chọn, hỗ trợ reduced motion/transparency và fallback backdrop.
- [x] Sidebar desktop, floating topbar và floating bottom navigation theo quyền người dùng.
- [x] Glass bottom sheet cho điều hướng phụ và bộ lọc; keyboard focus mặc định của native dialog.
- [x] Typography tiếng Việt, số tabular, input và touch target 44px+.
- [ ] Đo trực tiếp WCAG contrast trên ảnh của cả hai theme ở tất cả route.

## C. Màn hình

- [x] Dashboard: hero KPI, khoảng thời gian, bố cục thống kê, chart và luồng CTA.
- [x] Thêm chi phí và lịch sử chi phí: amount well, form sections, transaction rows, filter responsive.
- [x] Danh sách xe và hồ sơ xe.
- [x] Nhiên liệu, hành trình và biểu mẫu ghi nhận.
- [x] Bảo dưỡng, giấy tờ, nhắc hạn và biểu mẫu liên quan.
- [x] Báo cáo: KPI, phân tích thực, phân cấp bảng chi tiết, export hiện có.
- [x] Google Login, tài khoản, thành viên và trang phụ.
- [x] Loading/error/empty states, primary/secondary action, dialog.

## D. Visual QA

- [x] Browser QA **trang công khai `/login`** trên Chrome headless tại 360×800, 375×812, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1920×1080; tổng cộng 10 cấu hình light/dark. Không phát hiện tràn ngang.
- [x] Screenshot sau thay đổi được tạo bằng trình duyệt Chrome thực tế tại `tmp-ui-review/liquid-glass/`.
- [x] Hai vòng visual QA trên trang đăng nhập, có ảnh và chỉnh sửa khoảng cách logo/nội dung ở mobile, toggle theme ở 1024px, bố cục chiều cao card.
- [ ] Browser QA **các route bảo vệ** (dashboard, CRUD, báo cáo, floating bottom navigation khi đã đăng nhập) với phiên đăng nhập thật.
- [ ] Kiểm tra keyboard ảo iOS/Android, touch và OAuth trong phiên đăng nhập thật.

## E. Regression

- [x] Build sản xuất sau toàn bộ thay đổi: Next.js 15.5.27 build thành công, 23 trang static prerender. Sử dụng Prisma client đã có trong môi trường và preload `scripts/windows-realpath-compat.cjs` do giới hạn Windows/OneDrive và DNS khi generate Prisma.
- [x] Typecheck, ESLint và bộ test sau chỉnh sửa cuối: **đạt; 49/49 tests pass**.
- [ ] Google OAuth, chuyển không gian, phân quyền với tài khoản thật.
- [ ] Luồng lưu chi phí/ảnh chứng từ, báo cáo, export với dữ liệu thật.

Nguyên tắc xác nhận: mỗi dấu tích chỉ áp dụng cho đúng phạm vi đã chạy, không suy diễn sang OAuth/CRUD E2E. Chi tiết bằng chứng và giới hạn ở `UI_LIQUID_GLASS_QA.md`.
