# MASTER PROMPT — REDESIGN CARLOG THEO PHONG CÁCH PREMIUM LIQUID GLASS

> Dành cho Codex / OpenCode / Cursor / Claude Code.  
> Phạm vi: Thiết kế lại giao diện của ứng dụng CarLog — Quản lý xe & chi phí — trên repository đang có.  
> Nguyên tắc: **Thực thi trực tiếp trong code; bảo toàn chức năng; mobile-first; kiểm chứng bằng trình duyệt.**

## 1. VAI TRÒ

Bạn là **Principal Product Designer + Senior Frontend Engineer + Design Systems Architect** có kinh nghiệm xây dựng Premium SaaS Dashboard, ứng dụng tài chính và web app tối ưu di động.

Nhiệm vụ của bạn: **thiết kế lại toàn bộ UI/UX ứng dụng CarLog** theo ngôn ngữ **Premium Liquid Glass**, lấy cảm hứng từ vật liệu kính động, cảm giác phân lớp, ánh sáng phản chiếu và chuyển động mượt mà. Đây là **bản diễn giải phù hợp cho Web**, không phải tuyên bố sử dụng API Liquid Glass gốc của Apple và không sao chép nguyên xi thiết kế hoặc tài sản của Apple.

Tôi không hài lòng với giao diện hiện tại. Đừng sửa qua loa bằng cách đổi màu, thêm `backdrop-blur` lên tất cả thẻ hoặc chỉ bo góc lớn hơn. Hãy thực sự thiết kế lại bố cục, nhịp điệu thị giác, hệ thống điều hướng, typography, bảng dữ liệu, form, biểu đồ, phản hồi tương tác và trải nghiệm trên điện thoại.

**Mục tiêu thành phẩm:** CarLog trông như một sản phẩm SaaS/fintech cao cấp, tinh tế, đáng tin cậy; đẹp trên desktop và **xuất sắc trên mobile**, nhưng vẫn đặc biệt dễ đọc số tiền, ngày tháng, thông tin xe và báo cáo.

## 2. RÀNG BUỘC KHÔNG ĐƯỢC PHÁ VỠ

- Làm việc trên **repository hiện có**; kiểm tra stack, route, cấu trúc dự án, component và các trang trước khi sửa.
- **Giữ nguyên** Google OAuth/Gmail login, đăng xuất, session, quyền truy cập, API, database schema, dữ liệu thật, công thức nghiệp vụ, truy vấn thống kê, upload chứng từ, xuất Excel/PDF, PWA và các chức năng khác đã hoạt động.
- **Không** viết lại backend, migration database hoặc thay đổi business logic chỉ để phục vụ làm đẹp giao diện.
- Không xóa route, không xóa trường dữ liệu cần thiết, không thay tên field hoặc endpoint tùy tiện.
- Không làm mất validation, accessibility, trạng thái loading/error/empty, quyền theo vai trò, hoặc tính năng truy cập bàn phím.
- Không thay dữ liệu thật bằng mock data, hard-coded KPI/biểu đồ hoặc UI demo.
- Không thêm package lớn khi CSS/Tailwind và component hiện có đã giải quyết được vấn đề.
- Bảo toàn giao diện tiếng Việt, hiển thị đúng dấu tiếng Việt, tiền VND, ngày giờ Việt Nam.
- Trước khi làm, ghi nhận trạng thái Git; không xóa thay đổi chưa commit của người dùng; không tự ý reset lịch sử.

## 3. TRIẾT LÝ THIẾT KẾ: LIQUID GLASS ĐÚNG CÁCH

### 3.1. Từ khóa thị giác

**Translucency · Optical depth · Subtle refraction · Soft specular highlights · Floating navigation · Calm motion · Precision typography · Premium fintech · Clean data visualization.**

### 3.2. Phân lớp giao diện

Thiết kế theo 3 lớp:

1. **Background layer:** nền màu sáng ngọc trai hoặc xanh navy rất sâu; aurora/gradient rất nhẹ và có kiểm soát; tuyệt đối không làm nền rực rỡ hoặc gây nhiễu.
2. **Content layer:** bảng dữ liệu, form, nội dung báo cáo, phần lớn KPI cards sử dụng surface sáng/tối ổn định, độ tương phản cao. Có thể có độ trong mờ thấp nhưng **không mờ chữ và số liệu**.
3. **Floating functional glass layer:** sidebar, topbar, mobile bottom navigation, toolbar nổi, filter popover, menu, dropdown, modal, bottom sheet và các control quan trọng. Đây là nơi tập trung hiệu ứng kính trong, ánh sáng viền và hiệu ứng nổi.

**Không phủ kính lên mọi thứ.** Nếu mọi card đều blur và đổ bóng, giao diện sẽ rối, khó đọc và chậm. Liquid Glass là ngôn ngữ thể hiện phân cấp tương tác, không phải bộ lọc trang trí toàn màn hình.

### 3.3. Hiệu ứng kính

- Translucent background kết hợp `backdrop-filter: blur(...) saturate(...)` khi thiết bị hỗ trợ.
- Viền 1px bán trong suốt, gradient highlight rất nhẹ ở cạnh trên.
- Box shadow mềm, tạo cảm giác bề mặt nổi một cách tự nhiên.
- Radius nhất quán, tùy vai trò: control/pill/card/modal.
- Hover/focus/pressed có cảm giác phản hồi nhẹ, **không lắc, không nảy quá mức**.
- Chuyển động ưu tiên `opacity`, `transform` và animation nhẹ; tránh animate blur trên vùng lớn khi cuộn.
- Chỉ dùng hiệu ứng khúc xạ/phản chiếu phức tạp nếu không gây giảm hiệu năng và không làm sai nội dung phía sau.
- Có CSS fallback khi `backdrop-filter` không hỗ trợ: sử dụng màu nền gần như đặc, không mất độ tương phản.
- Hỗ trợ `prefers-reduced-motion`, `prefers-reduced-transparency` khi trình duyệt có hỗ trợ; luôn có chế độ ít hiệu ứng qua thiết kế fallback.

## 4. HỆ THỐNG THỊ GIÁC CARLOG

### 4.1. Màu sắc gợi ý

Sử dụng các token có ngữ nghĩa, tránh hard-code màu trong từng component. Có thể tinh chỉnh màu sau khi xem giao diện thực tế.

**Light theme**
- `--page-bg: #F4F7FC`
- `--text-primary: #10223F`
- `--text-secondary: #60708A`
- `--brand-primary: #2563EB`
- `--brand-deep: #153C88`
- `--accent-cyan: #53C5F7`
- `--surface-solid: #FFFFFF`
- `--glass-bg: rgba(255,255,255,.66)`
- `--glass-border: rgba(255,255,255,.68)`

**Dark theme**
- `--page-bg: #081426`
- `--text-primary: #F0F6FF`
- `--text-secondary: #B1C0D5`
- `--brand-primary: #6B9DFF`
- `--surface-solid: #111F35`
- `--glass-bg: rgba(21,39,66,.72)`
- `--glass-border: rgba(192,216,255,.18)`

Màu trạng thái: xanh thành công, vàng/cam cảnh báo, đỏ lỗi — phải bảo đảm ngữ nghĩa và độ tương phản.

### 4.2. Typography

- Ưu tiên **Be Vietnam Pro** hoặc font hiện có hỗ trợ tiếng Việt đầy đủ.
- Sử dụng chữ số dạng tabular cho số tiền, số km và chỉ số thống kê (`font-variant-numeric: tabular-nums`).
- Phân cấp title / section title / label / body / caption rõ ràng.
- Tránh chữ siêu nhạt, chữ quá nhỏ và quá nhiều weight khác nhau.
- Giá trị KPI phải dễ quét bằng mắt; VND và đơn vị km hiển thị nhất quán.

### 4.3. Spacing & components

- Hệ thống spacing nhất quán theo bội số 4/8px.
- Touch target tối thiểu khoảng **44×44 CSS px** cho tương tác chính trên mobile.
- Thiết lập tokens chung cho radius, border, shadow, backdrop, spacing, typography và z-index.
- Xây dựng các primitive có thể tái sử dụng: `GlassSurface`, `GlassNav`, `GlassButton`, `GlassToolbar`, `GlassPopover`, `GlassBottomSheet`, `GlassDialog`, `PageHeader`, `SectionHeading`, `MetricCard`, `DataToolbar`, `EmptyState`, `LoadingSkeleton`.
- Chỉ tạo component thực sự cần thiết; tránh abstraction quá mức.

## 5. THIẾT KẾ DESKTOP

### 5.1. App Shell

- Sidebar bên trái mang vật liệu frosted glass, có phân cấp group, icon Lucide nhất quán, active state rõ.
- Topbar nổi nhẹ với breadcrumb/tiêu đề, search, bộ lọc hoặc hành động ngữ cảnh và menu tài khoản Google.
- Main content có max-width/bố cục phù hợp dashboard, không bị dàn trải quá mức trên màn hình lớn.
- Khoảng cách giữa phần điều hướng và nội dung đủ tạo chiều sâu.
- Có trạng thái collapse sidebar nếu phù hợp mà không làm hỏng điều hướng.

### 5.2. Dashboard

Thiết kế lại theo trật tự: **nhìn tổng quan → hiểu xu hướng → phát hiện bất thường → truy cập chi tiết**.

- Page header `Tổng quan` + khoảng thời gian đang chọn + CTA `Thêm chi phí`.
- KPI nổi bật: Tổng chi phí, nhiên liệu, bảo dưỡng/sửa chữa, chi phí/km; chỉ số phụ: số xe, tổng km, nhắc hạn.
- KPI cards có surface rõ, điểm nhấn kính mờ ở lớp toolbar/chip, không để background làm giảm độ đọc con số.
- Biểu đồ chi phí theo tháng: đường nét chuyên nghiệp, tooltip rõ, bộ lọc tương tác thực.
- Donut cơ cấu chi phí: legend dễ hiểu, màu phân biệt rõ.
- So sánh chi phí các xe: thanh ngang/dọc, nhãn biển số rõ ràng.
- Giao dịch gần đây và cảnh báo bảo dưỡng/giấy tờ: dễ quét, truy cập nhanh.
- Không bịa dữ liệu hoặc tính toán khác API.

### 5.3. Data Table

- Header, toolbar, filter, search, sort, pagination rõ ràng.
- Số tiền căn phải, số liệu cùng cột dùng tabular numerals.
- Row hover/selected tinh tế, không gây giảm tương phản.
- Trạng thái empty/loading/error đẹp và hữu ích.
- Bảng trên desktop ưu tiên nền ổn định, không blur toàn bộ bảng.

## 6. THIẾT KẾ MOBILE-FIRST

Đây là ưu tiên số 1. **Không thu nhỏ giao diện desktop**.

- Kiểm thử tối thiểu width: **360, 375, 390, 430, 768, 1024, 1366, 1920px**.
- Header nhỏ, dễ hiểu, có page title và hành động quan trọng.
- **Floating glass bottom navigation** với vùng an toàn `env(safe-area-inset-bottom)`, không che nội dung và bàn phím.
- Các mục chính: `Tổng quan`, `Xe`, `Thêm`, `Lịch sử`, `Khác`; nút `Thêm` nổi bật nhưng không quá phô trương.
- KPI chuyển thành grid 2 cột hoặc card ngang tùy kích thước; không cắt mất tiền và đơn vị.
- Biểu đồ hỗ trợ touch tooltip, có nhãn dễ đọc, không tràn ngang.
- Lịch sử chi phí hiển thị transaction cards hoặc list rows thay vì bảng desktop.
- Bộ lọc dài mở qua glass bottom sheet, có Apply/Reset và trạng thái chọn rõ.
- Form thêm chi phí: chọn xe, danh mục, số tiền, ngày, ghi chú, hóa đơn; hỗ trợ bàn phím số, `Lưu` và `Lưu & thêm tiếp`.
- CTA quan trọng dễ chạm bằng một tay; hạn chế nested scroll; không che keyboard.
- Thiết kế cho cả Safari iOS, Chrome Android và mobile PWA.

## 7. CÁC MÀN HÌNH PHẢI REDESIGN

Không được chỉ làm đẹp Dashboard. Kiểm kê tất cả route thực tế trong repository; áp dụng ngôn ngữ thiết kế thống nhất cho **mọi màn hình đang tồn tại**:

1. **Google Login:** landing/login tối giản, nhận diện CarLog, một nút tiếp tục với Google rõ ràng; không tự dựng form mật khẩu không có trong hệ thống.
2. **Dashboard:** KPI, biểu đồ, cảnh báo, giao dịch mới nhất.
3. **Danh sách phương tiện:** vehicle cards đẹp, biển số nổi bật, trạng thái xe, CTA xem chi tiết.
4. **Chi tiết xe:** hero thông tin xe, tabs hoặc section rõ ràng, thông số km, chi phí và lịch sử.
5. **Thêm/sửa chi phí:** ưu tiên tốc độ nhập, validation tốt, chứng từ rõ ràng.
6. **Danh sách/lịch sử chi phí:** bộ lọc, nhóm theo ngày, tổng tiền và chi tiết từng khoản.
7. **Nhiên liệu:** số lít/kWh, đơn giá, đồng hồ km, mức tiêu hao đủ điều kiện tính.
8. **Bảo dưỡng/sửa chữa:** timeline, nhắc hạn, lịch sử và chi phí liên quan.
9. **Giấy tờ và nhắc hạn:** trạng thái sắp hết hạn/quá hạn không chỉ phân biệt bằng màu.
10. **Báo cáo:** biểu đồ, bộ lọc và bảng tổng hợp/chi tiết; luồng xuất Excel/PDF giữ nguyên.
11. **Cài đặt, tài khoản và phân quyền:** nếu repository hiện có.
12. **Các modal, toast, confirmation, dropdown, date picker và loading state** trên toàn hệ thống.

Với route chưa tồn tại hoặc module chưa triển khai, **không tự dựng trang giả chỉ để đủ danh sách**; ghi lại phạm vi chưa có trong báo cáo cuối.

## 8. DESIGN SYSTEM & KỸ THUẬT FRONTEND

- Giữ nguyên Next.js/React/Tailwind/shadcn/ui nếu đó là stack hiện tại.
- Ưu tiên CSS variables và Tailwind tokens.
- Viết glass primitives ở một nơi thống nhất, tránh CSS lặp lại/hard-coded ở hàng chục file.
- `backdrop-filter` có progressive enhancement và fallback nền đặc.
- Không dùng WebGL/canvas animation toàn màn hình chỉ vì hiệu ứng đẹp.
- Không phụ thuộc thư viện Liquid Glass bên ngoài nếu rủi ro bảo trì hoặc hiệu năng lớn.
- Không áp dụng hiệu ứng kính lên PDF, dữ liệu bảng tính hoặc biểu đồ làm khó đọc thông tin.
- Đảm bảo hỗ trợ dark/light, hệ thống icon và semantic colors.
- Responsive không làm hydration mismatch hoặc lỗi client/server rendering.
- Tôn trọng `prefers-reduced-motion`, giảm/chặn transition không cần thiết.
- Tôn trọng `prefers-reduced-transparency` nơi hỗ trợ; nơi không hỗ trợ vẫn có fallback dễ đọc.
- WCAG AA: tối thiểu 4.5:1 cho chữ thông thường, 3:1 cho chữ lớn và những thành phần đồ họa điều khiển liên quan; kiểm tra độ tương phản **trên nền thực tế sau blur**.
- Focus indicator dễ nhìn; keyboard tab order hợp lý; modal/bottom sheet focus trap và Escape/close đúng.

## 9. NHỮNG SAI LẦM PHẢI TRÁNH

- Glassmorphism kiểu cũ: tất cả card cùng trong suốt, mờ nhòe.
- Gradients tím-hồng rực rỡ, neon quá mức; dashboard giống landing page crypto.
- Quá nhiều icon và biểu tượng trang trí vô nghĩa.
- Chữ xám quá nhạt hoặc quá nhỏ.
- Dashboard nặng màu, chật chội, không phân cấp thị giác.
- Biểu đồ đẹp nhưng không đọc được số liệu.
- Nút `Thêm`, `Lưu`, `Xóa`, bộ lọc chỉ để trang trí, không có chức năng.
- Animation dài, parallax mạnh, phản xạ chuyển động liên tục làm giảm FPS.
- Glass bottom nav che nội dung hoặc không tương thích safe area.
- Dark mode chỉ đảo nền mà không chỉnh text, border, elevation.
- Sửa code UI làm hỏng backend hoặc Google Login.
- Tuyên bố hoàn thành khi mới sửa vài trang hoặc chưa mở ứng dụng bằng trình duyệt.

## 10. QUY TRÌNH LÀM VIỆC BẮT BUỘC

### Giai đoạn A — Audit UI hiện tại

1. Kiểm tra project, package.json, router, Tailwind/theme, layout, component, các route chính.
2. Chạy ứng dụng nếu môi trường cho phép.
3. Chụp ảnh hiện trạng desktop/mobile bằng Playwright/browser tool nếu có.
4. Liệt kê vấn đề: bố cục, khoảng cách, typography, responsive, contrast, control, chart, tốc độ thao tác.
5. Tạo `UI_LIQUID_GLASS_PLAN.md` với checklist có thể đánh dấu `[ ]` / `[x]`, theo mức độ ưu tiên.

### Giai đoạn B — Xây Design System

1. Tạo token màu, glass, typography, spacing, radius, shadow, motion và breakpoints.
2. Tạo/cập nhật các component dùng chung: navigation, button, card, modal, sheet, popover, inputs, toolbar, state components.
3. Tạo dark/light mode hoàn chỉnh.
4. Kiểm thử contrast và reduced motion/transparency.

### Giai đoạn C — Redesign các màn hình

Thứ tự triển khai:

1. App Shell + Sidebar + Topbar + Mobile Bottom Navigation.
2. Dashboard + KPI + Charts.
3. Thêm chi phí (luồng quan trọng nhất).
4. Danh sách/lịch sử chi phí.
5. Danh sách và chi tiết phương tiện.
6. Nhiên liệu, hành trình, bảo dưỡng, giấy tờ.
7. Báo cáo tổng hợp/chi tiết.
8. Google Login, tài khoản, settings và các route khác.
9. Loading, error, empty, toast, modal, confirmation.

Hoàn thành từng phần bằng code thực; tránh tạo lại màn hình từ đầu nếu có thể refactor an toàn.

### Giai đoạn D — Browser QA + Visual QA

- Dùng Playwright hoặc công cụ trình duyệt thực tế nếu khả dụng; mở từng màn hình.
- Chụp screenshot desktop **1366×768**, mobile **390×844** và thêm **360×800**; kiểm tra cả Light/Dark.
- Tự đánh giá và tiếp tục sửa qua **ít nhất 2 vòng visual QA** khi browser tool có sẵn.
- Kiểm tra overflow, clipping, sticky elements, safe area, popover layering, form keyboard, scroll, modal z-index.
- Kiểm tra nội dung thực, giao diện trống, dữ liệu dài, số tiền lớn, tên xe/biển số dài và trạng thái lỗi.
- Không khẳng định đã chụp screenshot hoặc kiểm thử khi thực tế không có công cụ thực hiện.

### Giai đoạn E — Functional Regression & Delivery

- Chạy lệnh build, lint, typecheck và test có sẵn; sửa lỗi do thay đổi UI gây ra.
- Kiểm tra đăng nhập Google và đăng xuất (nếu môi trường có tài khoản/credential phù hợp).
- Kiểm tra chọn xe → thêm chi phí → lưu → xem lịch sử → Dashboard cập nhật.
- Kiểm tra filter biểu đồ, khoảng thời gian, chi phí theo xe, mở chứng từ, xuất báo cáo nếu đã triển khai.
- Kiểm tra quyền và trạng thái bị từ chối truy cập.
- Lưu ảnh screenshot vào thư mục kết quả nếu công cụ và repository cho phép; không thêm ảnh rác vào production.
- Cập nhật checklist theo việc **đã kiểm chứng**, không tự đánh dấu hoàn tất các phần chưa chạy.

## 11. TIÊU CHÍ NGHIỆM THU

- [ ] CarLog có nhận diện thị giác nhất quán, thực sự mang phong cách premium liquid glass.
- [ ] Navigation và các lớp floating controls có hiệu ứng kính tinh tế.
- [ ] Nội dung tài chính/báo cáo rõ ràng, không bị blur hoặc thiếu tương phản.
- [ ] Dashboard hiện đại, có thứ tự thông tin hợp lý.
- [ ] Mobile 360–430px rất dễ sử dụng bằng một tay.
- [ ] Bottom nav không che nội dung, tương thích safe area.
- [ ] Form thêm chi phí ít thao tác, dễ nhập tiền và chụp hóa đơn.
- [ ] Giao diện tất cả route hiện hữu được đồng bộ, không chỉ Dashboard.
- [ ] Dark Mode và Light Mode đều có chất lượng.
- [ ] Trạng thái loading/empty/error/success đầy đủ.
- [ ] Không tràn layout bất thường, không lỗi tương phản nghiêm trọng.
- [ ] Có fallback khi blur/transparency không hỗ trợ hoặc bị hạn chế.
- [ ] Không phát sinh lỗi build/typecheck/test do thay đổi UI.
- [ ] Google Login, dữ liệu và nghiệp vụ hiện hữu vẫn hoạt động.
- [ ] Có báo cáo file đã sửa, trang đã hoàn tất, ảnh QA và vấn đề còn lại.

## 12. ĐẦU RA BẮT BUỘC

1. **Mã nguồn giao diện mới đã tích hợp vào ứng dụng hiện tại**.
2. `UI_LIQUID_GLASS_PLAN.md` — kế hoạch, checklist và tiến độ thật.
3. `UI_LIQUID_GLASS_DESIGN_SYSTEM.md` — colors, tokens, typography, components, states.
4. `UI_LIQUID_GLASS_QA.md` — ma trận màn hình / viewport / kết quả kiểm thử, lỗi còn lại.
5. Screenshot trước/sau nếu môi trường browser hỗ trợ.
6. Báo cáo ngắn về thay đổi, file được chỉnh sửa, test đã chạy và phần chưa thể kiểm chứng.

## 13. CÂU LỆNH KÍCH HOẠT

**Hãy bắt đầu ngay:** audit giao diện hiện tại trong repository, tạo `UI_LIQUID_GLASS_PLAN.md`, sau đó thiết kế và sửa trực tiếp code theo thứ tự App Shell → Design System → Dashboard → Mobile → Forms → các màn hình còn lại. Sau mỗi phần hãy chạy kiểm thử phù hợp, cập nhật checklist và dùng browser screenshot để lặp lại thiết kế khi có công cụ. Không dừng ở đề xuất, wireframe hoặc mockup; mục tiêu cuối là một ứng dụng CarLog hoạt động thực tế và có giao diện Premium Liquid Glass chuyên nghiệp.

---

### Tham khảo kỹ thuật và nguyên tắc

- Apple — Liquid Glass: https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass
- Apple — Materials (đặt Liquid Glass ở lớp điều hướng/điều khiển, không lạm dụng): https://developer.apple.com/design/human-interface-guidelines/materials
- MDN — `backdrop-filter`: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
- MDN — `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- MDN — `prefers-reduced-transparency`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency
