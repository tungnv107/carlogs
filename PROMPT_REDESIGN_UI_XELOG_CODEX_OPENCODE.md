# PROMPT CHO CODEX / OPENCODE — THIẾT KẾ LẠI TOÀN BỘ UI/UX CARLOG

## Vai trò và nhiệm vụ

Bạn là **Principal Product Designer + Senior Frontend Engineer**, chuyên thiết kế sản phẩm SaaS/Fintech có chất lượng thương mại. Bạn có quyền đọc, chỉnh sửa và chạy mã nguồn trong repository hiện tại.

Ứng dụng là **CarLog — Quản lý xe và chi phí thông minh**. Chức năng gồm đăng nhập Google, quản lý phương tiện, chi phí, nhiên liệu, hành trình, bảo dưỡng, giấy tờ, dashboard, báo cáo và xuất dữ liệu. **UI hiện tại chưa đạt yêu cầu: thiếu tinh tế, bố cục chưa hợp lý, trải nghiệm di động kém. Hãy thực sự redesign và refactor giao diện, không chỉ đổi màu hay bo góc.**

**Mục tiêu:** tạo sản phẩm nhìn như một ứng dụng thương mại đã được đầu tư thiết kế chuyên nghiệp; sạch, hiện đại, có hệ thống, cao cấp nhưng thân thiện; thao tác nhanh, đặc biệt trên điện thoại. Ưu tiên độ rõ ràng của dữ liệu và tốc độ nhập chi phí.

## 1. Nguyên tắc bắt buộc

1. **Làm trên repository hiện có.** Đầu tiên đọc cấu trúc dự án, routing, component, style, state, API, authentication và các trang thực tế. Kế thừa stack hiện có; không tạo một project mới nếu không cần.
2. **Giữ nguyên nghiệp vụ đang chạy:** database, API, công thức tính chi phí, phân quyền, đăng nhập Google, báo cáo và xuất file. Không sửa schema/backend trừ khi phát hiện nguyên nhân bắt buộc và có giải thích rõ.
3. Thiết kế lại **tất cả các màn hình đang có**, không dừng ở landing page hoặc dashboard demo. Không xóa chức năng để giao diện trông gọn hơn.
4. **Không sử dụng dữ liệu giả/hardcode cho dashboard production.** Duy trì binding dữ liệu thực và các trạng thái loading, error, empty.
5. **Không để nút giả**, đường dẫn hỏng, bộ lọc không tác dụng hoặc biểu đồ chỉ mang tính trang trí.
6. Giao diện bằng **tiếng Việt chuẩn, dấu câu chính xác**, đơn vị tiền tệ VND, định dạng số/ngày theo Việt Nam.
7. Ưu tiên **Mobile First**, sau đó nâng cấp thành trải nghiệm desktop chuyên nghiệp; không thu nhỏ giao diện desktop xuống mobile.
8. Bảo đảm accessibility cơ bản: màu tương phản, tab/keyboard, focus rõ, labels, kích thước vùng chạm, reduced motion khi cần.
9. Tuyệt đối tránh kiểu thiết kế AI đại trà: quá nhiều gradient, icon màu sặc sỡ, shadow đậm, card lặp vô nghĩa, typography bé, khoảng trắng thiếu chủ đích, layout giống template admin mặc định.

## 2. Quy trình bắt buộc trước khi sửa code

- Liệt kê tất cả route và thành phần UI đang có; xác định component nào có thể tái sử dụng.
- Đánh giá các vấn đề hiện tại về: hierarchy, navigation, spacing, typography, bảng, biểu đồ, form, responsive, trạng thái dữ liệu và UX.
- Nếu môi trường có browser/Playwright: chạy app và **chụp screenshot hiện trạng** ít nhất tại 390px và 1440px ở các màn hình trọng tâm. Nếu không thể chạy/chụp, ghi rõ giới hạn thay vì khẳng định đã kiểm tra.
- Tạo `UI_REDESIGN_PLAN.md`: danh sách trang, vấn đề, giải pháp, thứ tự triển khai, checklist nghiệm thu.
- Sau bước audit, **chủ động tiến hành sửa mã nguồn**, không dừng ở việc viết kế hoạch, không hỏi lại về các lựa chọn thẩm mỹ nhỏ.

## 3. Art direction và design system

**Định hướng:** *Premium automotive-finance SaaS*: tinh gọn như Linear, rõ ràng về chi tiêu như các ứng dụng tài chính tốt, thao tác mobile mượt như native app. Tham khảo về chất lượng và nguyên tắc, **không sao chép giao diện/nhận diện của sản phẩm khác**.

- **Cảm xúc thương hiệu:** đáng tin cậy, kiểm soát tốt, thông minh, nhanh, hiện đại.
- **Màu sắc chủ đạo (có thể tinh chỉnh hợp lý nhưng phải nhất quán):**
  - Brand navy: `#153C88`
  - Primary interactive blue: `#2563EB`
  - Accent teal: `#0D9488`
  - App background: `#F6F8FC`
  - Surface: `#FFFFFF`
  - Primary text: `#17253B`
  - Secondary text: `#66758C`
  - Border: `#E4EAF2`
  - Warning: `#D97706`; Danger: `#DC2626`; Success: `#059669`.
- **Typography:** ưu tiên `Be Vietnam Pro` hoặc `Inter` với đầy đủ dấu tiếng Việt; hệ thống cấp bậc rõ ràng: page title 26–30px desktop/22–24px mobile, section title 17–20px, body 14–16px, caption >=12px. Số KPI dùng tabular numerals.
- **Spacing:** theo thang 4/8px; khoảng cách giữa section 24–32px desktop và 16–24px mobile. Không dồn quá nhiều card sát nhau.
- **Card:** radius 14–18px; border mảnh, shadow rất nhẹ hoặc không shadow; nền trắng trên background xám lạnh, ưu tiên phân cấp bằng không gian và typography.
- **Buttons/inputs:** đồng bộ height 40–44px desktop, 44–48px mobile; primary CTA nổi bật nhưng không lạm dụng; focus/hover/disabled/loading rõ.
- **Icons:** Lucide nhất quán, kích thước 18–20px; chỉ dùng icon khi tăng khả năng nhận diện.
- **Charts:** tối đa 4–6 màu có ý nghĩa, tooltip đọc được, trục/đơn vị đúng, không hiệu ứng gây rối; responsive; không phải hình ảnh tĩnh.
- **Design tokens:** triển khai qua CSS variables/Tailwind theme, tạo hệ thống typography, spacing, semantic colors và component variants. Nếu dự án đang dùng shadcn/ui hãy customize đúng hướng, không giữ phong cách mặc định máy móc.
- Nếu ứng dụng đã có Dark Mode: redesign cả hai chế độ. Nếu chưa có: ưu tiên Light Mode thật xuất sắc trước, không để tính năng thứ cấp làm chậm hoàn thiện giao diện chính.

## 4. Kiến trúc trải nghiệm Desktop

- Sidebar rộng khoảng 240–264px, thanh thoát, có logo **CarLog**, menu nhóm hợp lý, active state nổi bật vừa đủ, có khả năng thu gọn nếu hữu ích.
- Topbar cao khoảng 64–72px: breadcrumb hoặc tiêu đề ngữ cảnh, chọn kỳ báo cáo nếu liên quan, thông báo, avatar tài khoản Google.
- Content area max-width hợp lý khoảng 1360–1440px, lề 24–32px; bố cục có nhịp điệu và hierarchy, không trải những card đơn điệu đầy chiều rộng.
- Navigation: **Tổng quan / Phương tiện / Chi phí / Nhiên liệu / Bảo dưỡng & Giấy tờ / Báo cáo / Cài đặt**; giữ route/feature thực tế và tổ chức lại menu nếu hợp lý.
- Table dữ liệu: sticky heading nếu cần, alignment số tiền về phải, filter rõ ràng, search, date range, pagination, actions dễ hiểu, mobile chuyển thành card/list chứ không ép bảng desktop.

## 5. Thiết kế lại từng màn hình trọng tâm

### 5.1 Dashboard — màn hình quan trọng nhất

**Desktop**
- Header có lời chào ngắn và bộ lọc kỳ (tháng này, quý, năm, tùy chỉnh) + filter phương tiện.
- Hàng KPI có các chỉ số *thực*: tổng chi phí kỳ, nhiên liệu, bảo dưỡng/sửa chữa, quãng đường hoặc chi phí/km (chỉ hiện nếu đủ dữ liệu), có so sánh kỳ trước khi có dữ liệu hợp lệ.
- Bố cục biểu đồ có trọng tâm: **xu hướng chi phí** chiếm vùng lớn; **cơ cấu chi phí** chiếm vùng phụ; phía dưới là **chi phí theo xe**, **giao dịch gần đây**, **nhắc hạn quan trọng**.
- Ưu tiên diễn giải nhanh “tiền đang chi vào đâu, xe nào tốn nhất, khoản nào cần chú ý”. Không nhồi tất cả biểu đồ lên màn hình đầu tiên.

**Mobile**
- Header gọn: CarLog, avatar, kỳ đang xem.
- KPI hiển thị theo cấu trúc 1 card nổi bật + 2 card nhỏ, hoặc grid 2 cột cân đối; số tiền không bị cắt/dính chữ.
- Biểu đồ full width, nhãn rút gọn và tooltip dễ chạm.
- Giao dịch gần đây hiển thị card có icon danh mục, tên xe, ngày và số tiền rõ ràng.
- CTA **“+ Thêm chi phí”** dễ thấy ngay trên màn hình.

### 5.2 Danh sách và hồ sơ phương tiện

- Mỗi xe là card có phân cấp: tên/biển số, hình xe (nếu dữ liệu có), trạng thái, tổng chi phí kỳ, số km, lịch bảo dưỡng gần nhất.
- Empty State có CTA “Thêm xe đầu tiên”.
- Chi tiết xe có header đẹp, tab/section hợp lý: Tổng quan, Chi phí, Nhiên liệu, Bảo dưỡng, Giấy tờ, Hành trình (theo chức năng hiện hữu).
- Đưa các tác vụ thường dùng lên vị trí dễ tiếp cận: thêm chi phí, ghi nhận đổ xăng, cập nhật số km.

### 5.3 Thêm chi phí — tối ưu chuyển đổi và thao tác

Mục tiêu: **chọn xe → chọn danh mục → nhập số tiền → lưu**, ưu tiên 2–3 thao tác chính khi ngữ cảnh đã được ghi nhớ.

- Mobile dùng full-screen form hoặc bottom sheet nếu thật sự phù hợp, không dùng modal desktop bị bó chật.
- Input **Số tiền** rõ nhất, bật numeric keyboard, format VND khi nhập nhưng không làm nhảy con trỏ sai.
- Picker chọn xe có tìm kiếm và gợi ý xe gần nhất.
- Danh mục thể hiện bằng lựa chọn rõ, icon phù hợp, không quá nhiều lựa chọn trên một hàng.
- Ngày mặc định hôm nay; trường bổ sung (số km, đơn vị cung cấp, ghi chú, chứng từ) gói thành khu vực mở rộng nếu không bắt buộc.
- Chụp/đính kèm hóa đơn ngay từ camera trên mobile nếu chức năng đã hỗ trợ.
- Nút **Lưu chi phí** cố định ở cuối trong vùng an toàn màn hình; có trạng thái đang lưu, lỗi, thành công; chống double submit; xác nhận xong điều hướng hợp lý.
- Giữ nguyên validation, nghiệp vụ và dữ liệu.

### 5.4 Danh sách chi phí / lịch sử

- Desktop có summary nhỏ, toolbar lọc, bảng tinh tế với số tiền nổi bật và danh mục dễ nhận diện.
- Mobile dùng transaction list theo ngày; mỗi item hiển thị tên chi phí, xe, ngày, số tiền, trạng thái/chứng từ nếu có.
- Filter theo xe, danh mục, khoảng thời gian dùng bottom sheet trên mobile; hiển thị filter đang áp dụng và dễ xóa.

### 5.5 Nhiên liệu, bảo dưỡng, đăng kiểm, giấy tờ

- Tạo ngôn ngữ UI nhất quán với các trang chi phí.
- Dữ liệu lịch hẹn/hạn dùng badge semantic vừa phải: còn hạn, sắp đến, quá hạn.
- Chi tiết bảo dưỡng tổ chức theo timeline hoặc list rõ ràng, không dùng timeline nếu nó làm chật mobile.
- Form nhiên liệu hiển thị hợp lý cho lít/kWh, km, giá, tổng tiền, không đánh đồng đơn vị.

### 5.6 Báo cáo và biểu đồ

- Toolbar filter theo kỳ, phương tiện, danh mục; phản ánh ngay vào KPI/chart/table.
- Báo cáo tổng hợp có nhóm chỉ số ngắn và biểu đồ, sau đó bảng chi tiết.
- Desktop ưu tiên bảng; mobile hiển thị card hoặc danh sách có drill-down.
- Nút xuất Excel/PDF thật, giữ nguyên nghiệp vụ backend.
- Nhãn `đ`, `km`, `L/100 km`, `kWh/100 km` chính xác; hiển thị “Chưa đủ dữ liệu” thay vì 0 khi không đủ mẫu tính.

### 5.7 Google Login & các trạng thái hệ thống

- Trang đăng nhập sạch, có nhận diện CarLog và nút **Tiếp tục với Google** chuẩn, đáng tin cậy, dễ bấm trên mobile.
- Thiết kế Empty State, Skeleton Loading, Error State, Success Feedback, 403/404 để hệ thống nhất quán.
- Không thay đổi logic OAuth/callback/session/role.

## 6. Navigation và tương tác mobile

- Tại viewport dưới 768px: **Bottom Navigation** 4–5 mục: Tổng quan, Xe của tôi, Thêm (+), Chi phí, Menu; có safe-area insets.
- Header ít chi tiết, mọi thao tác quan trọng nằm trong tầm ngón tay.
- Touch target tối thiểu **44×44 CSS px**; không phụ thuộc hover.
- Bộ lọc nâng cao mở qua Bottom Sheet/Drawer, có nút Áp dụng và Xóa lọc.
- Không có scroll ngang toàn trang; không có button bị che bởi keyboard/bottom bar; test cả long text và số tiền lớn.
- Responsive tại **360, 390, 768, 1024, 1440px**; kiểm tra portrait mobile.
- Hạn chế animation; ưu tiên cảm giác phản hồi nhanh, chuyển trạng thái ngắn và có chủ đích.

## 7. Cách tổ chức code

- Xây dựng/chuẩn hóa các component dùng chung: `AppShell`, `Sidebar`, `Topbar`, `MobileBottomNav`, `PageHeader`, `StatCard`, `SectionCard`, `VehicleCard`, `TransactionItem`, `ExpenseForm`, `FilterDrawer`, `DataTable`, `ChartContainer`, `EmptyState`, `Skeleton`, `ConfirmDialog`.
- Không trùng lặp cùng một pattern qua nhiều màn hình.
- Tách phần data-fetching/business logic khỏi presentation đủ rõ ràng để UI dễ cải tiến sau này.
- Giữ API contract, route, auth guard, permissions, Zod validation đang hoạt động.
- Không cài hàng loạt UI libraries mới. Tận dụng Tailwind/shadcn/Lucide/Recharts nếu repository hiện có.
- Có thể di chuyển/refactor component để nâng chất lượng nhưng phải tránh regressions.

## 8. Bắt buộc tự kiểm thử giao diện và chức năng

Sau khi code, **phải chạy ứng dụng và tự kiểm tra**:

1. Build, typecheck, lint và các test có sẵn; sửa lỗi phát sinh.
2. Nếu có công cụ browser/Playwright, chụp **screenshot AFTER** cho dashboard, danh sách xe, chi tiết xe, thêm chi phí, lịch sử chi phí, báo cáo và login ở **desktop 1440px + mobile 390px**; đối chiếu với BEFORE.
3. Kiểm tra tại 360/390/768/1024/1440px: clipping, overflow, text overlap, tab focus, spacing, broken charts, modal và bottom nav.
4. Kiểm tra một hành trình thật: Google Login (nếu có credentials test), chọn xe, thêm chi phí, lưu, thấy chi phí trong lịch sử và số liệu dashboard cập nhật.
5. Kiểm tra các trạng thái ít dữ liệu/không có dữ liệu, load chậm, lỗi API, tên xe dài, số tiền lớn và danh sách có nhiều phần tử.
6. Nếu không có browser, account hoặc môi trường chạy phù hợp, **báo cáo trung thực phần chưa xác minh** và vẫn hoàn thiện code khả thi trong phạm vi được phép.

## 9. Tiêu chí chấp nhận thiết kế

- Cảm nhận tổng thể: **premium, nhất quán, sạch, có chủ đích**, không giống template admin ngẫu nhiên.
- Visual hierarchy rõ: người dùng biết ngay chỉ số quan trọng, hành động chính, dữ liệu cần chú ý.
- Không có quá nhiều KPI ngang hàng, màu nhấn vô tội vạ hay card chỉ để lấp chỗ trống.
- Mobile có cảm giác sản phẩm được thiết kế riêng, chứ không phải bản desktop thu nhỏ.
- Mọi trang sử dụng cùng design tokens và component patterns.
- Các nghiệp vụ và dữ liệu hiện tại vẫn hoạt động.
- Có screenshot/kiểm tra thực tế nếu môi trường cho phép; không tuyên bố đã hoàn thiện nếu chưa kiểm tra.

## 10. Đầu ra bắt buộc

1. **Code UI/UX đã được redesign thực tế trong repository**.
2. File `UI_REDESIGN_PLAN.md` có checklist và trạng thái hoàn thành theo màn hình.
3. File `UI_DESIGN_SYSTEM.md` mô tả màu, typography, spacing, component và responsive rules.
4. Screenshot trước/sau (nếu môi trường hỗ trợ) tại desktop và mobile.
5. Báo cáo cuối cùng gồm: màn hình đã sửa, quyết định thiết kế chính, file quan trọng đã thay đổi, kiểm thử đã chạy, lỗi còn tồn tại/hạn chế chưa xác minh.

**Hành động ngay:** kiểm tra repository → audit UI hiện tại → tạo kế hoạch → triển khai redesign theo thứ tự **App Shell + Design System → Dashboard → Mobile Navigation → Thêm chi phí → Phương tiện → Lịch sử → Báo cáo → Màn hình còn lại → kiểm thử**. Không chỉ cung cấp lời khuyên; hãy sửa code và hoàn thiện giao diện tới mức có thể sử dụng thực tế.
