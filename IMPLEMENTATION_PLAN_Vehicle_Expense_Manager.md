# KẾ HOẠCH TRIỂN KHAI ỨNG DỤNG QUẢN LÝ XE VÀ CHI PHÍ

> **Tên dự án:** Vehicle & Expense Manager  
> **Loại tài liệu:** Implementation Plan / Master Task List  
> **Phiên bản:** 1.0  
> **Ngày lập:** 13/10/2026  
> **Trạng thái:** GĐ0 đã hoàn tất; đã có mã nguồn các phân hệ GĐ1–GĐ7, tiếp tục hoàn thiện và chờ nghiệm thu PostgreSQL/Google OAuth/mobile/restore  
> **Nguồn yêu cầu:** `Prompt_Web_Quan_Ly_Xe_Chi_Phi_Google_Login.md`  
> **Đối tượng sử dụng:** Chủ dự án, lập trình viên, Codex, OpenCode, Cursor, Claude Code.  
> **Ngôn ngữ sản phẩm:** Tiếng Việt; **tiền tệ:** VND; **múi giờ giao diện:** Asia/Ho_Chi_Minh.

## 1. Mục tiêu và phạm vi

Xây dựng ứng dụng web **Mobile First** quản lý nhiều phương tiện, theo dõi chi phí, nhiên liệu/sạc điện, hành trình, bảo dưỡng, giấy tờ, nhắc hạn; có **đăng nhập Google**, dashboard KPI, biểu đồ, báo cáo tổng hợp/chi tiết và xuất Excel/PDF. Ứng dụng sử dụng cơ sở dữ liệu thực, chạy được bằng Docker trên VPS.

### 1.1. Tiêu chí thành công cốt lõi

1. Đăng nhập qua tài khoản Google (OAuth 2.0/OpenID Connect) hoạt động, lưu người dùng và bảo vệ truy cập dữ liệu.
2. Thêm xe và ghi nhận chi phí từ điện thoại; sau khi lưu, dữ liệu tồn tại qua reload và cập nhật Dashboard.
3. Mọi loại chi phí (nhiên liệu, bảo dưỡng, sửa chữa, khác) chỉ xuất hiện **một lần** trong sổ chi phí tổng.
4. Lọc và xuất báo cáo đúng theo kỳ, phương tiện, danh mục; số liệu KPI = số liệu báo cáo = dữ liệu xuất.
5. Hiển thị tốt trên điện thoại 360–430px; không tràn ngang; thao tác bằng một tay dễ dàng.
6. Có kiểm thử, cấu hình deploy, hướng dẫn sao lưu và phục hồi dữ liệu.

### 1.2. Ranh giới MVP và mở rộng

| Phạm vi | Trong MVP | Sau MVP / tùy chọn |
|---|---|---|
| Đăng nhập Google | Bắt buộc | Thêm phương thức đăng nhập khác |
| Tài khoản và tổ chức | Không gian cá nhân và lời mời vào tổ chức, RBAC cơ bản | Quy trình phê duyệt nhiều cấp |
| Phương tiện | CRUD, ảnh, tìm kiếm, trạng thái, chi tiết | Tích hợp thiết bị GPS/OBD |
| Chi phí | CRUD, danh mục, hóa đơn, lọc, lịch sử | OCR hóa đơn, định mức ngân sách |
| Nhiên liệu/sạc | Ghi nhận số lượng, giá, km, biểu đồ cơ bản | Tự nhận dữ liệu từ nhà cung cấp |
| Hành trình | Nhập thủ công số km và mục đích | Theo dõi hành trình tự động |
| Bảo dưỡng và giấy tờ | Hồ sơ, hạn, thông báo trong ứng dụng | Gửi push/email, đặt lịch gara |
| Dashboard & báo cáo | KPI, 6 biểu đồ, tổng hợp/chi tiết, Excel/PDF | Dự báo chi phí bằng AI |
| Di động | Responsive, PWA có thể cài, chụp hóa đơn | Tạo chi phí offline và đồng bộ xung đột |

**Không thuộc MVP:** đọc hộp thư Gmail; Google Drive API; đồng bộ ngân hàng; GPS thời gian thực; OCR; mobile native; microservices. Đăng nhập Google chỉ dùng các scope `openid email profile`.

## 2. Kiến trúc và nguyên tắc kỹ thuật

### 2.1. Stack mục tiêu

- **UI:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide.
- **Biểu đồ:** Recharts; **form:** React Hook Form + Zod.
- **Backend:** Next.js Server Actions/Route Handlers, business service layer và repository/data-access layer rõ ràng.
- **Database:** PostgreSQL + Prisma ORM + migrations.
- **Authentication:** Auth.js/NextAuth với Google OAuth/OpenID Connect; account liên kết theo `providerAccountId/sub`, không theo email duy nhất.
- **Tệp đính kèm:** Object Storage có quyền truy cập riêng (ưu tiên), hoặc volume riêng với API kiểm soát quyền.
- **Xuất báo cáo:** thư viện Excel `.xlsx` và PDF phù hợp, đảm bảo tiếng Việt và định dạng tiền.
- **Đóng gói:** Docker multi-stage build + Docker Compose + reverse proxy HTTPS.
- **Kiểm thử:** unit tests, integration tests, E2E (Playwright hoặc tương đương), kiểm thử responsive.

**Nguyên tắc:** modular monolith; tách `UI → Action/API → Service → Data Access`; các phương pháp tổng hợp số liệu dùng chung. Không buộc phải thay stack nếu repository hiện có tương thích; ghi lại các quyết định tại `docs/ARCHITECTURE.md`.

### 2.2. Quy ước bắt buộc ngay từ đầu

- Mọi bảng nghiệp vụ có `organizationId` phù hợp; mọi query phải xét quyền theo tổ chức và quyền sử dụng xe; không tin ID từ client.
- Dùng `Decimal/Numeric` cho tiền, số lượng nhiên liệu và đơn giá; không tính tài chính bằng `float`.
- VND hiển thị số nguyên; quy tắc làm tròn về đơn vị đồng được định nghĩa **tại service**, dùng nhất quán cho UI và export.
- Thời gian lưu UTC hoặc kiểu có timezone, **ngày nghiệp vụ** được xử lý nhất quán theo `Asia/Ho_Chi_Minh`.
- Chi phí được thống kê từ **một nguồn chuẩn `expenses`**; các bảng nhiên liệu/bảo dưỡng liên kết đến nó theo `expenseId` duy nhất; không cộng các bảng phụ lần nữa.
- Sổ chi phí dùng trạng thái `POSTED`/`VOID` (hoặc quy ước tương đương). Chỉ `POSTED` được đưa vào báo cáo; hủy/điều chỉnh có audit log.
- Bổ sung idempotency key cho hành động ghi chi phí để tránh bấm lưu hai lần/gửi lại request.
- Khi không đủ dữ liệu tính km hoặc tiêu hao, hiển thị **“Chưa đủ dữ liệu”**, không hiển thị 0 như thể đã tính.
- Các giá trị tổng hợp được tính trên server; không thu gom toàn bộ transactions về browser.

## 3. Các mốc bàn giao

| Mốc | Điều kiện đạt | Sản phẩm sử dụng được |
|---|---|---|
| **M0 – Sẵn sàng triển khai** | Hoàn tất GĐ0 | Repo, tài liệu kiến trúc, phân tích yêu cầu, thiết kế sơ bộ |
| **M1 – Đăng nhập được** | Hoàn tất GĐ1 | Đăng nhập Google, tạo không gian dữ liệu, bảo vệ các route |
| **M2 – MVP nghiệp vụ** | Hoàn tất GĐ2 | Quản lý xe, nhập chi phí, hóa đơn và lịch sử chi phí trên điện thoại |
| **M3 – Quản lý vận hành** | Hoàn tất GĐ3–GĐ4 | Nhiên liệu, hành trình, bảo dưỡng, giấy tờ và nhắc hạn |
| **M4 – MVP báo cáo** | Hoàn tất GĐ5 | Dashboard, báo cáo tổng hợp/chi tiết, Excel/PDF nhất quán |
| **M5 – Ready for production** | Hoàn tất GĐ6–GĐ7 | Mobile/PWA được tối ưu, kiểm thử, giám sát, backup, Docker triển khai |

**Ưu tiên phát hành sớm:** có thể triển khai bản nội bộ sau **M2**, nhưng phải hoàn tất các kiểm soát bảo mật/backup tối thiểu ở GĐ7 trước khi đưa dữ liệu thật vào production.

### 3.1. Ước lượng tham khảo (không phải cam kết tiến độ)

| Giai đoạn | Thời lượng tham khảo* | Phụ thuộc |
|---|---:|---|
| GĐ0 – Phân tích & kiến trúc | 2–3 ngày | Không |
| GĐ1 – Nền tảng & đăng nhập Google | 4–6 ngày | GĐ0 |
| GĐ2 – Xe & sổ chi phí | 7–10 ngày | GĐ1 |
| GĐ3 – Nhiên liệu & hành trình | 4–6 ngày | GĐ2 |
| GĐ4 – Bảo dưỡng, giấy tờ, nhắc hạn | 4–6 ngày | GĐ2; có thể song song GĐ3 |
| GĐ5 – Dashboard & báo cáo | 6–9 ngày | GĐ2, GĐ3; dữ liệu GĐ4 để đủ báo cáo |
| GĐ6 – Tối ưu mobile/PWA | 3–5 ngày | Có thể triển khai xuyên suốt, chốt sau GĐ5 |
| GĐ7 – QA, bảo mật & triển khai | 5–8 ngày | Các giai đoạn trước |

*Cho nhóm nhỏ có kinh nghiệm và công cụ AI hỗ trợ; chưa bao gồm thời gian sửa đổi phạm vi, Google OAuth verification nếu phát sinh, hoặc hạ tầng chưa sẵn sàng. Tiến độ thực tế phụ thuộc repository, thiết kế và nhân sự.

---

## 4. GĐ0 — Khảo sát, đặc tả và thiết kế kiến trúc

**Mục tiêu:** Chốt phạm vi, luồng dữ liệu, giao diện cốt lõi và quyết định kiến trúc trước khi lập trình.

### Công việc

- [x] **P0-01** Kiểm tra source repository (nếu có), `package.json`, môi trường build, routing, conventions; không xóa công việc đang có.
- [x] **P0-02** Đối chiếu danh sách chức năng và lập ma trận MVP / hậu MVP; nhận diện các điểm còn thiếu dữ liệu nghiệp vụ.
- [x] **P0-03** Viết use cases: đăng nhập; tạo xe; thêm chi phí; đổ nhiên liệu; hành trình; bảo dưỡng; xem báo cáo; xuất dữ liệu.
- [x] **P0-04** Chốt chính sách không gian cá nhân / tổ chức, quyền mặc định, mời thành viên, cách bootstrap admin lần đầu.
- [x] **P0-05** Thiết kế sơ đồ dữ liệu ERD sơ bộ và bảng dữ liệu chính; xác định quan hệ `expenses ↔ fuel_logs/maintenance_records`.
- [x] **P0-06** Thiết kế sơ đồ luồng nghiệp vụ, menu desktop, bottom nav mobile; wireframe 3 màn hình trọng tâm: Dashboard, Danh sách xe, Thêm chi phí.
- [x] **P0-07** Chốt công thức KPI, cách xử lý missing data, trạng thái giao dịch và timezone.
- [x] **P0-08** Viết kiến trúc triển khai và quy ước code: module boundaries, validation, authentication, authorization, logging.
- [x] **P0-09** Lập test plan ban đầu, thiết lập quy trình trạng thái task và chuẩn Definition of Done (DoD).

**Bàn giao:** `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/UI_UX_GUIDELINES.md`, `docs/TEST_PLAN.md`, bản kế hoạch này được cập nhật trạng thái.

**Nghiệm thu:** mọi yêu cầu trọng tâm được ánh xạ vào module, database và kịch bản kiểm thử; chưa có logic báo cáo mơ hồ hoặc cộng trùng.

## 5. GĐ1 — Khởi tạo hệ thống, database và Google Login

**Mục tiêu:** Đăng nhập Google an toàn, có người dùng trong database, dữ liệu phân tách theo tổ chức.

### Công việc

- [ ] **P1-01** Khởi tạo/chuẩn hóa Next.js + TypeScript + Tailwind + shadcn/ui + lint/format scripts.
- [ ] **P1-02** Cấu hình PostgreSQL, Prisma, migration đầu tiên và seed danh mục; tạo `.env.example` không chứa secrets.
- [ ] **P1-03** Tạo `users`, `accounts`, `sessions` (nếu dùng DB session), `organizations`, `organization_members`, `roles/permissions` và audit log cơ bản.
- [ ] **P1-04** Tích hợp Auth.js Google provider, màn hình “Tiếp tục với Google”, callback và session lifecycle.
- [ ] **P1-05** Nhận diện tài khoản qua Google `sub/providerAccountId`; ngăn tự gộp tài khoản chỉ dựa vào email.
- [ ] **P1-06** Onboarding cá nhân: tạo tổ chức riêng + quyền chủ sở hữu; onboarding tổ chức theo lời mời/chấp thuận; không tự cấp Admin toàn hệ thống.
- [ ] **P1-07** Xây `requireSession()`, `requireOrganizationAccess()` và permission guards dùng tại server layer.
- [ ] **P1-08** Xây protected layouts, topbar avatar/tên người dùng, chọn không gian làm việc, đăng xuất, trạng thái lỗi xác thực.
- [x] **P1-09** Viết `docs/GOOGLE_LOGIN_SETUP.md`: Google Cloud OAuth client, consent screen, redirect URIs dev/prod, scopes và khắc phục lỗi callback.
- [ ] **P1-10** Unit/integration/E2E test cho user provision, Google callback, session, account linking, route protection và cross-organization access.

**Lưu ý cấu hình:** Không cần quyền Gmail API. Dùng OAuth scopes tối thiểu `openid email profile`. Callback mẫu với cấu hình Auth.js phổ biến: `/api/auth/callback/google`, **đối chiếu route thực tế của phiên bản sử dụng**. Không đưa `GOOGLE_CLIENT_SECRET` vào client hoặc Git.

**Bàn giao:** Trang đăng nhập Google hoạt động, protected Dashboard skeleton, role guards, Prisma migrations, docs Google OAuth.

**Nghiệm thu:** đăng nhập lại không tạo user trùng; user mới không xem được tài khoản/tổ chức khác; session logout đúng; không hardcode admin Gmail; không rò rỉ secrets.

## 6. GĐ2 — Quản lý xe và sổ chi phí (MVP trọng tâm)

**Mục tiêu:** Xây dựng vòng lặp đầu tiên: **Chọn xe → Nhập chi phí → Lưu → Xem lịch sử → Số liệu thay đổi**.

### 6.1. Quản lý xe

- [ ] **P2-01** Tạo schema `vehicles` (organization, biển số, hãng, mẫu, loại, nhiên liệu, km, ảnh, trạng thái, người phụ trách).
- [ ] **P2-02** CRUD phương tiện với validation; biển số chuẩn hóa, kiểm soát trùng trong phạm vi tổ chức theo chính sách sản phẩm.
- [ ] **P2-03** Danh sách xe responsive: card mobile, table desktop, tìm kiếm, lọc và phân trang.
- [ ] **P2-04** Trang chi tiết xe, ảnh xe, thông tin chung, lịch sử chi phí và thống kê tối thiểu.
- [ ] **P2-05** Phân quyền thao tác xe; xe đã có giao dịch không bị xóa cứng thiếu kiểm soát.

### 6.2. Danh mục và giao dịch chi phí

- [ ] **P2-06** Tạo `expense_categories` với các nhóm: nhiên liệu, bảo dưỡng, sửa chữa, gửi xe/cầu đường, đăng kiểm/bảo hiểm, khác.
- [ ] **P2-07** Tạo `expenses` là **nguồn sổ cái duy nhất** (vehicle, category, occurredAt, amount, odo, vendor, notes, createdBy, status, idempotencyKey).
- [ ] **P2-08** Triển khai thêm chi phí nhanh: ngày mặc định, gợi ý xe gần nhất, bàn phím số, định dạng VND, thêm ảnh chứng từ, “Lưu và thêm tiếp”.
- [ ] **P2-09** Xây API/Server Actions + transaction + authorization + validation + idempotency, tránh lưu hai lần.
- [ ] **P2-10** Xem/sửa/hủy giao dịch theo quyền; ghi audit log (giá trị trước/sau, actor, timestamp); không mất chứng từ.
- [ ] **P2-11** Lịch sử chi phí lọc ngày/xe/danh mục/người nhập, tìm kiếm, phân trang; card mobile thay cho table rộng.
- [ ] **P2-12** Upload hóa đơn/ảnh an toàn: size/MIME validation, file private, access check và liên kết `attachments`.
- [ ] **P2-13** Cập nhật thống kê chi phí đơn giản trên Dashboard và trang xe bằng truy vấn thật.
- [ ] **P2-14** Test amount precision, double submit, data isolation, void vs posted, filter, timezone cutoff, quyền CRUD.

**Bàn giao:** xe + chi phí end-to-end trên mobile; lịch sử theo xe; lưu hóa đơn; thống kê tổng chi phí kỳ hiện tại.

**Nghiệm thu:** tạo xe, thêm giao dịch, reload vẫn còn; tổng chi phí = tổng `POSTED` trong phạm vi lọc; sửa/hủy làm thay đổi chính xác số liệu; không bấm lưu trùng.

**Ưu tiên UX:** Người dùng đã đăng nhập và đang ở Dashboard có thể mở form thêm chi phí bằng **1 thao tác**, hoàn thành form phổ biến trong vài thao tác chính.

## 7. GĐ3 — Nhiên liệu/sạc điện, hành trình và số km

**Mục tiêu:** Theo dõi chi phí năng lượng và quãng đường với các công thức hợp lệ, không tính mức tiêu hao khi dữ liệu thiếu.

### Công việc

- [ ] **P3-01** Tạo `fuel_logs`: `vehicleId`, `expenseId UNIQUE`, datetime, odometer, energyType, quantity, unit, unitPrice, isFullTank, vendor.
- [ ] **P3-02** Xây form nhập xăng/dầu/sạc điện; đơn vị L/kWh theo loại xe; tổng tiền = số lượng × đơn giá theo Decimal.
- [ ] **P3-03** Khi lưu fuel log, tạo/chỉnh sửa expense nguồn chuẩn trong **cùng transaction**; bảo đảm không cộng trùng.
- [ ] **P3-04** Thống kê tổng lượng nhiên liệu/điện, tổng tiền, đơn giá bình quân có trọng số theo số lượng.
- [ ] **P3-05** Tính tiêu hao L/100 km với chu kỳ đầy bình hợp lệ; kWh/100 km với khoảng đo có đủ km và lượng điện tương ứng; hiển thị không đủ dữ liệu nếu thiếu mốc.
- [ ] **P3-06** Tạo `trip_logs`: km đầu/cuối, thời điểm, mục đích, tài xế, xe; validation không âm và không chồng lấn không hợp lệ.
- [ ] **P3-07** Cơ chế xử lý điều chỉnh đồng hồ km (odometer corrections) có lý do + audit; không cập nhật giảm im lặng.
- [ ] **P3-08** Tạo bộ chọn nguồn quãng đường thống nhất cho báo cáo: **ưu tiên tổng km hành trình hợp lệ**; không tự suy diễn tổng km trong kỳ từ giá trị odometer cuối kỳ nếu thiếu đầu kỳ; không cộng hành trình trùng.
- [ ] **P3-09** Lịch sử nhiên liệu/hành trình, lọc theo xe và thời gian, biểu đồ xu hướng cơ bản.
- [x] **P3-10** Viết tests kiểm tra chu kỳ đổ đầy, giá điện/xăng khác đơn vị, mốc km thiếu, zero distance, hành trình chồng lấn.

**Bàn giao:** Nhập nhiên liệu/sạc, ghi chuyến đi, xem lịch sử và tính chi phí nhiên liệu/km/tiêu hao với nhãn độ tin cậy dữ liệu.

**Nghiệm thu:** không cộng trùng fuel expense; không chia 0; L và kWh không bị tổng hợp như một đơn vị; thiếu dữ liệu hiện N/A hợp lý.

## 8. GĐ4 — Bảo dưỡng, sửa chữa, giấy tờ và nhắc hạn

**Mục tiêu:** Quản lý lịch sử công việc của xe và các nghĩa vụ sắp/quá hạn.

### Công việc

- [ ] **P4-01** Xây `maintenance_records` (loại bảo dưỡng/sửa chữa, thời điểm, km, gara, nội dung, `expenseId UNIQUE` nếu phát sinh chi phí).
- [ ] **P4-02** Form và danh sách lịch sử bảo dưỡng/sửa chữa; khi ghi phí có liên kết expense; hỗ trợ ghi công việc không phát sinh phí.
- [ ] **P4-03** Xây `maintenance_schedules`: hạn theo ngày, km, hoặc cả hai; ngưỡng cảnh báo tùy chỉnh theo xe/hạng mục.
- [ ] **P4-04** Xây `vehicle_documents`: loại giấy tờ, số giấy, ngày có hiệu lực/hết hạn, file đính kèm, trạng thái.
- [ ] **P4-05** Notification model và notification center: sắp đến hạn, đến hạn, quá hạn, đã xử lý.
- [ ] **P4-06** Job chạy định kỳ để tạo/cập nhật thông báo theo ngày/km, có chống lặp thông báo; hỗ trợ retry và quan sát lỗi job.
- [ ] **P4-07** Dashboard widget cảnh báo và trang danh sách việc cần làm, cho phép đánh dấu hoàn thành sau khi ghi nhận nghiệp vụ tương ứng.
- [ ] **P4-08** Kiểm thử đúng ngưỡng km/ngày, timezone, job idempotency và quyền truy cập tài liệu.
- [ ] **P4-09** Hoàn thành lịch bảo dưỡng qua bản ghi công việc được chọn tường minh; cùng tổ chức/xe, sau ngày lập lịch, audit ID công việc. Cần nghiệm thu IDOR và trạng thái cạnh tranh trên PostgreSQL thực.

**Bàn giao:** trang bảo dưỡng/sửa chữa, giấy tờ xe, nhắc hạn và notification center trong ứng dụng.

**Nghiệm thu:** thông báo tự sinh mà không cần mở website; tránh lặp; ghi sửa chữa có phí không nhân đôi expense; cảnh báo hết hạn chính xác.

**Ghi chú:** email/push thông báo là mở rộng sau MVP; chưa cần Google Gmail scope hoặc quyền gửi thư.

## 9. GĐ5 — Dashboard, biểu đồ và hệ thống báo cáo

**Mục tiêu:** Toàn bộ chỉ tiêu phân tích được định nghĩa chặt chẽ, đồng nhất và cập nhật theo filter.

### 9.1. Backend analytics dùng chung

- [ ] **P5-01** Thiết lập `reportingService`/query layer dùng chung cho KPI, charts, bảng báo cáo, export; kiểm tra timezone và quyền.
- [ ] **P5-02** Bộ lọc toàn cục: xe (một/nhiều/tất cả theo quyền), từ ngày–đến ngày, kỳ chuẩn, danh mục; trạng thái URL đồng bộ khi phù hợp.
- [ ] **P5-03** Định nghĩa kỳ so sánh tương đương và null/NA khi không có dữ liệu kỳ trước; không tạo phần trăm vô hạn.
- [ ] **P5-04** Tối ưu truy vấn bằng GROUP BY SQL, indexes và server pagination; không dùng client-side aggregate toàn bộ dữ liệu.

### 9.2. Dashboard và biểu đồ

- [ ] **P5-05** KPI: tổng xe, tổng chi phí, nhiên liệu, bảo dưỡng/sửa chữa, tổng km đủ điều kiện, chi phí/km, xe cần bảo dưỡng, giấy tờ sắp hết hạn.
- [ ] **P5-06** Line/Area: tổng chi phí theo thời gian, so sánh kỳ trước.
- [ ] **P5-07** Donut: cơ cấu chi phí theo danh mục.
- [ ] **P5-08** Bar: chi phí theo phương tiện.
- [ ] **P5-09** Line/Bar: chi phí nhiên liệu theo thời gian.
- [ ] **P5-10** Line: xu hướng chi phí/km khi quãng đường hợp lệ.
- [ ] **P5-11** Horizontal Bar: Top 5/10 xe có chi phí cao.
- [ ] **P5-12** Loading/empty/error states, tooltip định dạng VND/đơn vị, màu sắc nhất quán, responsive charts.

### 9.3. Báo cáo và xuất file

- [ ] **P5-13** Báo cáo tổng hợp theo kỳ/xe/danh mục có tổng cộng và tỷ trọng.
- [ ] **P5-14** Báo cáo chi tiết: thời gian, xe/biển số, danh mục, nội dung, km, tiền, người nhập, vendor, chứng từ; sort/filter/pagination server-side.
- [ ] **P5-15** Báo cáo theo xe: tổng chi phí, nhóm phí, nhiên liệu, km, chi phí/km, xu hướng.
- [ ] **P5-16** Báo cáo nhiên liệu/năng lượng: lượng, chi phí, giá bình quân, tiêu hao hợp lệ.
- [ ] **P5-17** Báo cáo so sánh giữa hai xe/kỳ với cùng định nghĩa và cảnh báo dữ liệu thiếu.
- [ ] **P5-18** Xuất Excel `.xlsx` và PDF có Unicode tiếng Việt, tiêu đề, filter, đơn vị, tổng cộng; tệp tải về đúng quyền, chống CSV/Excel formula injection từ dữ liệu nhập.
- [ ] **P5-19** Test đối chiếu trực tiếp database ↔ dashboard ↔ API báo cáo ↔ file export; multi-tenant isolation; khoảng ngày qua giao thừa/cuối tháng.

**Bàn giao:** Dashboard 6 biểu đồ, 5 nhóm báo cáo, Excel/PDF, bộ lọc động và service tổng hợp thống nhất.

**Nghiệm thu:** thay đổi 1 giao dịch `POSTED`/`VOID` cập nhật đúng mọi điểm hiển thị; kết quả trong cùng bộ lọc khớp tuyệt đối giữa Dashboard, báo cáo và file export; chỉ số km không hiển thị giả khi không đủ dữ liệu.

## 10. GĐ6 — Tối ưu Mobile First, UX và PWA

**Mục tiêu:** Trải nghiệm như ứng dụng trên điện thoại, không đơn thuần thu nhỏ giao diện desktop.

### Công việc

- [ ] **P6-01** Mobile bottom nav: Tổng quan, Phương tiện, Thêm chi phí, Lịch sử, Menu; desktop sidebar.
- [ ] **P6-02** Quick-add form dùng số lớn, date picker, searchable vehicle selector, nút cố định vùng dễ chạm, số tiền tự định dạng.
- [ ] **P6-03** Bộ lọc dùng Bottom Sheet trên mobile; tối ưu ngón tay, safe-area, keyboard avoidance, touch targets >=44×44px.
- [ ] **P6-04** Card hóa danh sách dài; biểu đồ có tooltip chạm, nhãn ngắn, không overflow ngang.
- [ ] **P6-05** Hỗ trợ chọn ảnh từ camera/thư viện, xem ảnh trước khi upload, retry khi mạng lỗi.
- [ ] **P6-06** Hoàn thiện dark mode, skeleton, empty states, toast, confirm dialogs và accessibility cơ bản.
- [ ] **P6-07** PWA manifest, icons, service worker với cache static assets, offline fallback; chỉ báo trạng thái kết nối.
- [ ] **P6-08** **Không** giả lập offline transaction sync trong MVP; khi mất mạng, form báo rõ chưa lưu lên máy chủ (có thể giữ nháp ở UI nếu hợp lý).
- [ ] **P6-09** Đo hiệu năng trên mạng di động và kiểm thử viewport 360/390/430/768/1366/1920px; Android Chrome, iOS Safari, desktop browsers.

**Bàn giao:** UI hoàn chỉnh, cài ứng dụng từ trình duyệt, thao tác nhanh trên điện thoại.

**Nghiệm thu:** không tràn ngang ở các màn hình trọng yếu; thêm chi phí nhanh; không mất dữ liệu do lỗi validation; ảnh từ camera tải được; PWA có manifest/offline fallback đúng chức năng công bố.

## 11. GĐ7 — Kiểm thử, bảo mật, triển khai và bàn giao

**Mục tiêu:** Bản production ổn định, an toàn, có quy trình khôi phục.

### Công việc

- [x] **P7-01** Unit tests cho công thức, decimal precision, business rules, access guards, date filters.
- [ ] **P7-02** Integration tests cho mutation nhiều bảng, idempotency, migrations, query báo cáo và auth.
- [ ] **P7-03** E2E flow: đăng nhập → tạo xe → thêm phí → nhập nhiên liệu → xem dashboard/báo cáo → export.
- [ ] **P7-04** Security review: OAuth secrets, CSRF/XSS, session cookies, object-level authorization/IDOR, upload, rate limiting ở điểm phù hợp.
- [ ] **P7-05** Database migrations, indexes, seed dev/staging, dữ liệu demo tách riêng production.
- [ ] **P7-06** Dockerfile multi-stage; `compose.yaml` web/db (+ object storage/job nếu cần); health checks; restart policy; persistent volumes.
- [ ] **P7-07** Reverse proxy + HTTPS; production Google callback URL; môi trường server có đồng bộ giờ, tránh sai proxy host/headers.
- [ ] **P7-08** Logging có cấu trúc, error reporting, health endpoint, giám sát disk/DB/jobs; không ghi token/secret trong log.
- [ ] **P7-09** Database backup tự động, lưu ngoài máy chủ nếu có thể; backup file attachment; **thực hành restore** vào môi trường kiểm thử.
- [ ] **P7-10** CI chạy lint/typecheck/tests/build và kiểm tra dependencies/secrets phù hợp.
- [ ] **P7-11** Staging/UAT với bộ dữ liệu kiểm thử, đối chiếu chi phí thực tế và nghiệm thu nghiệp vụ trên điện thoại.
- [x] **P7-12** Viết `README.md`, hướng dẫn deploy, Google setup, sử dụng, backup/restore, rollback; version và release notes.
- [x] **P7-13** Unit tests bổ sung phân trang server sau lọc và các điều kiện liên kết lịch bảo dưỡng với bản ghi công việc (ID, tổ chức, xe, thời gian, trạng thái).

**Bàn giao:** Docker deployment hoạt động trên VPS, pipeline kiểm thử, hướng dẫn sử dụng/quản trị, hồ sơ nghiệm thu, bản release tag.

**Nghiệm thu:** qua bảng kiểm ở mục 17; backup/restore đã thử; sau reboot services vẫn hoạt động; route chưa đăng nhập không thể truy cập dữ liệu; prod secrets không lộ.

---

## 12. Thiết kế database ưu tiên để triển khai

| Bảng | Trường chính / quan hệ | Ghi chú |
|---|---|---|
| `users` | id, name, email, image, status, timestamps | Google profile; không dùng email làm provider identity duy nhất |
| `accounts` | userId, provider, providerAccountId | Unique `(provider, providerAccountId)`; theo Auth.js adapter |
| `sessions` | session token, userId, expires | Nếu cấu hình DB sessions |
| `organizations` | id, name, createdBy | Không gian cá nhân hoặc tổ chức |
| `organization_members` | organizationId, userId, role, status | Unique `(organizationId, userId)` |
| `vehicles` | id, organizationId, plate, type, fuelType, odometer, status | Xe thuộc đúng một tổ chức |
| `expense_categories` | id, organizationId?, type, name, active | Danh mục mặc định + tùy chỉnh |
| **`expenses`** | id, organizationId, vehicleId, categoryId, occurredAt, amount DECIMAL, status, createdBy, idempotencyKey | **Nguồn chuẩn duy nhất cho mọi tổng chi phí** |
| `fuel_logs` | id, organizationId, vehicleId, **expenseId UNIQUE**, quantity, unit, unitPrice, odometer | 1 log ↔ 1 expense nếu có phí |
| `trip_logs` | id, organizationId, vehicleId, startedAt, endedAt, odoStart, odoEnd, distance | Kiểm tra chồng lấn / số km |
| `maintenance_records` | id, organizationId, vehicleId, expenseId UNIQUE nullable, type, completedAt, odometer | Bao gồm sửa chữa; có thể không phát sinh phí |
| `maintenance_schedules` | id, vehicleId, ruleType, nextDueAt, nextDueOdometer, alertThreshold | Lịch theo km/ngày |
| `vehicle_documents` | id, organizationId, vehicleId, docType, issuedAt, expiresAt, attachmentId | Đăng kiểm/bảo hiểm… |
| `vendors` | id, organizationId, name, contact | Gara, cây xăng, đối tác |
| `attachments` | id, organizationId, ownerType, ownerId, objectKey, mimeType, size | Storage private + quyền truy cập |
| `notifications` | id, organizationId, userId?, vehicleId?, type, dedupeKey, readAt, status | Dedupe cảnh báo |
| `audit_logs` | id, organizationId, actorId, entityType, entityId, action, before, after, timestamp | Mask dữ liệu nhạy cảm |
| `odometer_adjustments` | id, organizationId, vehicleId, previous, adjusted, reason, actorId | Truy vết sửa đồng hồ |
| `invitations` | id, organizationId, email, role, tokenHash, expiresAt, acceptedAt | Tham gia tổ chức an toàn |

### 12.1. Ràng buộc/index ưu tiên

- Composite indexes phục vụ báo cáo: `expenses(organizationId, occurredAt, status)`, `expenses(organizationId, vehicleId, occurredAt)`, `expenses(organizationId, categoryId, occurredAt)`.
- Foreign keys đầy đủ; check amount/quantity/distance không âm theo nghiệp vụ; unique identity Google, unique idempotency trong phạm vi thích hợp.
- Khi truy vấn theo xe, bảo đảm `vehicles.organizationId` phù hợp `expenses.organizationId` (service validation + DB strategy).
- `fuel_logs.expenseId` và `maintenance_records.expenseId` không được cùng trỏ vào một expense nếu nghiệp vụ cấm; enforce tại service bằng transaction + test.
- Không sửa giá trị tiền của giao dịch đã khóa một cách âm thầm; dùng audit hoặc bút toán điều chỉnh nếu nâng cấp theo quy tắc kế toán.

### 12.2. Quy tắc công thức (single source of truth)

| Chỉ số | Định nghĩa tính |
|---|---|
| Tổng chi phí | `SUM(expenses.amount)` với `status=POSTED`, trong tổ chức, xe và kỳ được chọn |
| Chi phí nhóm | Tổng expense `POSTED` theo `categoryId/type`, **không cộng riêng fuel_logs** |
| Tỷ trọng danh mục | `chi phí nhóm / tổng chi phí × 100%` nếu mẫu số > 0 |
| Chi phí trung bình/km | `tổng chi phí kỳ / tổng km hành trình hợp lệ của cùng kỳ` khi tổng km > 0; hiển thị N/A nếu không đủ dữ liệu |
| Chi phí nhiên liệu/km | `tổng expense loại nhiên liệu / tổng km hợp lệ cùng kỳ` |
| Giá nhiên liệu bình quân | `tổng tiền mua cùng loại năng lượng / tổng lượng cùng đơn vị`, nếu lượng > 0 |
| Xăng/dầu L/100 km | Lít tiêu thụ của **chu kỳ đầy bình hợp lệ** / km trong chu kỳ × 100 |
| Xe điện kWh/100 km | kWh sử dụng trong **khoảng đo có dữ liệu khớp và tin cậy** / km tương ứng × 100 |
| Biến động % kỳ trước | `(kỳ hiện tại − kỳ trước) / kỳ trước × 100%`; nếu kỳ trước = 0, hiển thị N/A / mô tả thay thế |
| Độ dài kỳ báo cáo | Ngày bắt đầu inclusive và ngày kết thúc exclusive theo ranh giới ngày ở múi giờ kinh doanh |

**Lưu ý về km:** Chi phí/km là chỉ số ước tính theo quãng đường **đã ghi nhận đầy đủ**; nếu chỉ một phần hành trình được nhập, phải cảnh báo “Dữ liệu hành trình có thể chưa đầy đủ”. Có thể bổ sung cơ chế km đầu/cuối kỳ đã xác thực ở bản nâng cấp.

## 13. Danh sách routes và màn hình đề xuất

| Route mẫu | Nội dung | Responsive priority |
|---|---|---|
| `/login` | Đăng nhập Google | Mobile cao |
| `/onboarding` | Không gian cá nhân/tổ chức | Mobile cao |
| `/dashboard` | KPI, biểu đồ, cảnh báo | Mobile cao |
| `/vehicles` | Danh sách xe | Mobile cao |
| `/vehicles/new` | Thêm xe | Mobile cao |
| `/vehicles/[id]` | Hồ sơ xe và lịch sử | Mobile cao |
| `/expenses` | Lịch sử chi phí + filter | Mobile cao |
| `/expenses/new` | Nhập chi phí nhanh | **Mobile cao nhất** |
| `/fuel` | Lịch sử đổ nhiên liệu/sạc | Mobile cao |
| `/fuel/new` | Ghi nhiên liệu/sạc | Mobile cao |
| `/trips` | Hành trình, số km | Mobile cao |
| `/maintenance` | Bảo dưỡng/sửa chữa | Mobile cao |
| `/documents` | Giấy tờ và nhắc hạn | Mobile cao |
| `/reports/summary` | Báo cáo tổng hợp | Responsive |
| `/reports/details` | Báo cáo chi tiết | Responsive |
| `/reports/vehicles` | Báo cáo theo xe | Responsive |
| `/reports/fuel` | Báo cáo năng lượng | Responsive |
| `/reports/compare` | So sánh phương tiện | Responsive |
| `/settings/members` | Mời và phân quyền | Desktop + mobile |
| `/settings/categories` | Danh mục chi phí | Desktop + mobile |

**Mobile bottom nav:** Tổng quan · Phương tiện · **Thêm chi phí** · Lịch sử · Menu. Cần bảo đảm không trùng CTA, có back navigation rõ ràng.

## 14. API / service layer và phân quyền

### 14.1. Các module code

- `auth`: Google OAuth, sessions, current user, guards.
- `organizations`: onboarding, invitations, organization membership.
- `vehicles`: CRUD, state transitions, images, ownership.
- `expenses`: ledger mutations, categories, uploads, audits.
- `fuel`: fuel events, source expense transaction, calculations.
- `trips`: odometer, distance, trip history and validity.
- `maintenance`: jobs, maintenance records, vehicle documents.
- `notifications`: due rule engine, dedupe, inbox.
- `reporting`: aggregates, filters, reconciliation, exports.
- `settings`: categories and configuration.

### 14.2. RBAC tham chiếu

| Vai trò | Xem dữ liệu | Thêm chi phí | Sửa/hủy chi phí | Quản lý xe | Xuất báo cáo | Quản trị thành viên |
|---|---|---|---|---|---|---|
| Owner/Admin | Trong tổ chức | Có | Có | Có | Có | Có |
| Manager | Theo phạm vi | Có | Theo quyền | Có | Có | Không mặc định |
| Accountant | Theo phạm vi | Có | Theo quyền | Đọc | Có | Không |
| Driver/User | Xe được giao | Xe được giao | Giao dịch của mình theo chính sách | Đọc | Không mặc định | Không |
| Viewer | Được cấp | Không | Không | Đọc | Theo cấu hình | Không |

**Quy tắc:** Không chỉ ẩn nút ở client; service kiểm tra scope tổ chức, role, quyền trên từng xe và owner entity. Với API phục vụ export hoặc attachments, bắt buộc authorization riêng.

## 15. Cấu trúc thư mục gợi ý

```text
vehicle-expense-manager/
├── app/
│   ├── (public)/login/
│   ├── (protected)/dashboard/
│   ├── (protected)/vehicles/
│   ├── (protected)/expenses/
│   ├── (protected)/fuel/
│   ├── (protected)/trips/
│   ├── (protected)/maintenance/
│   ├── (protected)/documents/
│   ├── (protected)/reports/
│   ├── (protected)/settings/
│   └── api/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── charts/
│   └── forms/
├── modules/
│   ├── auth/
│   ├── organizations/
│   ├── vehicles/
│   ├── expenses/
│   ├── fuel/
│   ├── trips/
│   ├── maintenance/
│   ├── notifications/
│   └── reporting/
├── lib/                # prisma, permissions, validation, dates, decimal
├── prisma/             # schema, migrations, seed
├── tests/              # unit, integration, e2e
├── docs/
├── public/             # PWA icons, public assets only
├── Dockerfile
├── compose.yaml
├── .env.example
├── IMPLEMENTATION_PLAN.md
└── README.md
```

**Không** lưu hóa đơn có thông tin cá nhân trực tiếp vào `public/`.

## 16. Hướng dẫn giao việc cho Codex/OpenCode

### 16.1. Quy trình thực hiện chuẩn

1. Đọc `Prompt_Web_Quan_Ly_Xe_Chi_Phi_Google_Login.md` và file kế hoạch này, sau đó khảo sát source thực tế.
2. Lập danh sách khác biệt giữa mã nguồn đang có và kế hoạch; không ghi đè code hợp lệ chỉ để làm theo cấu trúc mẫu.
3. Chọn task chưa hoàn thành theo thứ tự phụ thuộc; cập nhật `IMPLEMENTATION_PLAN.md` sau mỗi task.
4. Với từng task: nêu mục tiêu, danh sách file cần tạo/sửa, migration (nếu có), triển khai, viết tests, chạy kiểm tra.
5. Sau mỗi nhóm task: chạy `lint`, `typecheck`, test tương ứng, `build`; ghi lỗi còn tồn tại và cách khắc phục.
6. Bảo đảm không có nút giả, dữ liệu KPI hardcode, API thiếu quyền hoặc duplicate expenses.
7. Kết thúc giai đoạn: tạo changelog ngắn, ảnh/chứng cứ UI nếu môi trường hỗ trợ, cập nhật trạng thái mốc và các vấn đề mở.

### 16.2. Mẫu yêu cầu thực thi cho AI Agent

```text
Hãy đọc toàn bộ IMPLEMENTATION_PLAN.md và file Prompt_Web_Quan_Ly_Xe_Chi_Phi_Google_Login.md.

1. Kiểm tra repository hiện tại và xác định công việc đã hoàn thành thực tế.
2. Chỉ triển khai các task chưa hoàn thành của giai đoạn ưu tiên tiếp theo, theo dependency.
3. Code đầy đủ backend + frontend + database migrations + validation + authorization + tests.
4. Không sử dụng mock data làm nguồn dữ liệu dashboard/report trong sản phẩm.
5. Đảm bảo expenses là nguồn tổng hợp chi phí duy nhất; các fuel/maintenance logs tham chiếu expenseId.
6. Kiểm tra mobile 360px/390px; không để layout tràn ngang.
7. Chạy lint, typecheck, tests và build (nếu môi trường hỗ trợ); sửa lỗi phát hiện được.
8. Cập nhật checkbox task trong IMPLEMENTATION_PLAN.md chỉ sau khi đã xác minh.
9. Báo cáo: Task IDs đã làm, file đã thay đổi, migration, test kết quả, blocker và task tiếp theo.
10. Không hỏi xác nhận cho các quyết định kỹ thuật thường quy; ghi giả định rõ trong docs khi cần.

Bắt đầu từ giai đoạn chưa hoàn thành sớm nhất.
```

### 16.3. Definition of Done cho mọi task

- [ ] Code thật hoạt động với database/API; không phải màn hình tĩnh.
- [ ] Validation, loading, empty state, error handling.
- [ ] Authentication/authorization đúng theo phạm vi.
- [ ] Unit/integration/E2E test ở mức phù hợp.
- [ ] Responsive mobile ở màn hình liên quan.
- [ ] Lint/typecheck/build không phát sinh lỗi do task.
- [ ] Migrations và env docs được bổ sung khi cần.
- [ ] Cập nhật trạng thái task + ghi chú giải pháp và blocker.

## 17. Checklist nghiệm thu end-to-end

| ID | Kịch bản | Kết quả mong đợi |
|---|---|---|
| **AT-01** | User đăng nhập Google lần đầu | Tạo đúng 1 user, có session, onboarding an toàn |
| **AT-02** | User đăng nhập lại Google | Không sinh trùng tài khoản; quyền giữ nguyên |
| **AT-03** | User A dùng URL/ID xe của tổ chức B | Backend từ chối, không lộ dữ liệu |
| **AT-04** | Tạo xe, tải ảnh, reload | Xe và ảnh tồn tại, hiển thị trong danh sách |
| **AT-05** | Nhập chi phí 150.000 VND | Tổng chi phí tăng đúng 150.000 VND |
| **AT-06** | Double tap nút lưu/gửi request lại | Chỉ tạo một giao dịch hợp lệ |
| **AT-07** | Ghi fuel log có tổng tiền | Sổ `expenses` thêm một dòng liên kết, không hai dòng |
| **AT-08** | Sửa/hủy expense | Dashboard và báo cáo cập nhật nhất quán, có audit |
| **AT-09** | Nhập nhiên liệu thiếu mốc đầy bình/odo | Không công bố L/100km giả |
| **AT-10** | Xe điện nhập kWh | Báo cáo không cộng lẫn lít và kWh |
| **AT-11** | Hành trình km cuối < km đầu | Form/server từ chối có giải thích |
| **AT-12** | Ghi bảo dưỡng có phí | Liên kết một khoản expense; dashboard không cộng trùng |
| **AT-13** | Đến hạn đăng kiểm khi người dùng không online | Scheduler tạo thông báo hợp lệ, không lặp |
| **AT-14** | Lọc báo cáo tháng trước / theo xe | KPI, chart, table, Excel, PDF khớp số liệu |
| **AT-15** | Báo cáo tổng quãng đường = 0/chưa đủ | Hiển thị N/A, không chia 0 |
| **AT-16** | Xuất file Excel/PDF | Tiếng Việt đúng dấu, tiêu đề/bộ lọc/tổng tiền rõ ràng |
| **AT-17** | Mobile iPhone/Android 360–430px | Không tràn ngang, nút dễ chạm, form dùng được |
| **AT-18** | Dùng camera chụp hóa đơn | Upload thành công, chỉ người có quyền xem được |
| **AT-19** | Mất kết nối lúc nhập | Không báo lưu server thành công khi chưa thành công |
| **AT-20** | Logout, hết hạn session | Không truy cập được API/route được bảo vệ |
| **AT-21** | Triển khai docker rồi restart | Ứng dụng và database persistent hoạt động trở lại |
| **AT-22** | Restore backup trên môi trường test | Phục hồi dữ liệu và file chứng từ nhất quán |

### 17.1. Điều kiện Go/No-Go trước production

**GO khi:** mọi test quan trọng AT-01–AT-22 đạt hoặc có ngoại lệ được chủ dự án chấp thuận; không có bug severity Critical/High mở; Google OAuth prod config hợp lệ; các quy trình backup/restore, secrets, HTTPS, permissions được xác minh.

**NO-GO khi:** có rò rỉ dữ liệu tổ chức, cộng trùng tiền, sai báo cáo nghiêm trọng, mất dữ liệu, Google login không ổn định, hoặc chưa kiểm chứng backup/restore.

## 18. Quản lý rủi ro, giả định và quyết định

| Rủi ro | Mức độ | Biện pháp |
|---|---|---|
| Google OAuth `redirect_uri_mismatch` hoặc app chưa cho phép user thật | Cao | Hướng dẫn Google Cloud; kiểm tra callback dev/prod; cấu hình test users / publishing phù hợp |
| Truy cập chéo tổ chức (IDOR) | Rất cao | Organization guards ở service, query filtering, integration test cross-tenant |
| Cộng trùng chi phí từ fuel/maintenance | Rất cao | `expenses` là nguồn chuẩn; `expenseId UNIQUE`, transactions và reconciliation test |
| Số km/tiêu hao không chính xác vì dữ liệu thiếu | Cao | Định nghĩa chu kỳ hợp lệ, cảnh báo độ phủ và N/A khi không đủ |
| Mất dữ liệu hoặc hóa đơn | Rất cao | Backup database + object storage, thử restore, migration được kiểm tra |
| Mobile UX nặng/khó dùng | Trung bình/Cao | Thiết kế từ mobile và test 360px ở từng giai đoạn |
| Báo cáo chậm khi dữ liệu tăng | Trung bình | Server aggregation, indexes, pagination, query profiling |
| Scope creep và phát triển quá nhiều trước MVP | Cao | Freeze MVP, hoàn tất từng milestone, đưa OCR/GPS/offline sync vào backlog |

### 18.1. Những quyết định cần ghi nhận khi khởi tạo

- **ADR-001:** Kiến trúc modular monolith và stack thực tế.
- **ADR-002:** Auth.js Google Login, session strategy và account linking.
- **ADR-003:** Individual workspace / multi-organization model và invitation flow.
- **ADR-004:** Expense ledger canonical model, posted/void policy và decimal rounding.
- **ADR-005:** Phương pháp đo quãng đường, chi phí/km, tiêu hao nhiên liệu/điện.
- **ADR-006:** Storage private, signed URL/proxy download và lưu trữ file.
- **ADR-007:** Job scheduler/notifications phù hợp môi trường Docker.

## 19. Vận hành, tài liệu và bàn giao

Các file dự kiến có khi kết thúc:

```text
README.md
IMPLEMENTATION_PLAN.md
.env.example
Dockerfile
compose.yaml
prisma/schema.prisma
prisma/migrations/
docs/REQUIREMENTS.md
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/UI_UX_GUIDELINES.md
docs/GOOGLE_LOGIN_SETUP.md
docs/API.md
docs/TEST_PLAN.md
docs/DEPLOYMENT.md
docs/BACKUP_RESTORE.md
docs/USER_GUIDE.md
docs/RELEASE_NOTES.md
```

**Báo cáo cuối mỗi giai đoạn:** tổng task đã xong, phần đang làm, trở ngại, ảnh hưởng tới tiến độ, các kiểm thử đã chạy/kết quả và đề xuất nhiệm vụ tiếp theo.

### 19.1. Mẫu nhật ký triển khai

| Ngày | Giai đoạn/Task ID | Tình trạng | Thay đổi chính | Kết quả test | Vấn đề còn lại |
|---|---|---|---|---|---|
| 2026-10-13 | P0-01–P0-09 | Hoàn thành tài liệu/khảo sát | Đặc tả MVP, 8 use cases, ADR, ERD sơ bộ, wireframe, test plan | Đối chiếu prompt với tài liệu, rà soát mã nguồn; unit 10/10 | Các module GĐ3–GĐ7 chưa triển khai |
| 2026-10-13 | P1-09 | Hoàn thành tài liệu | Hướng dẫn Google Cloud OAuth, redirect URI, scopes, lỗi callback | Đối chiếu với Auth.js route và `.env.example` | Google credentials thật chưa có; P1-04/P1-10 chưa nghiệm thu |
| 2026-10-13 | P1-01–P1-08, P2-01–P2-13 | Đang triển khai/chưa nghiệm thu E2E | Có source Next.js/Auth.js/Prisma, migrations, UI xe, nhập/sửa/hủy chi phí, file private, dashboard; bổ sung audit khi lưu trữ xe và PostgreSQL dev Compose | Unit 10/10; lint/typecheck/build được chạy; kiểm tra sau sửa đổi ở log tiếp theo | Docker daemon không kết nối, chưa chạy migration/PostgreSQL và chưa thể thử Google callback; giữ checkbox mở |
| 2026-10-13 | P2-02, P2-08–P2-10, P2-12–P2-14 (bổ sung) | Có mã nguồn, kiểm thử tĩnh/unit; **chưa đạt DoD E2E** | Chặn giảm odometer trực tiếp (kể cả cạnh tranh cập nhật); giữ form khi action báo lỗi; preview chứng từ; hỏi xác nhận trước khi hủy; làm mới thống kê trên trang xe sau thay đổi expense | Unit **12/12**, lint, typecheck, `prisma validate`, production build **đạt** (build cần thử lại do OneDrive báo `EPERM` thoáng qua) | Chưa xác minh CRUD, Google callback, isolation và upload/download với PostgreSQL, OAuth thật; giữ checkbox P1/P2 mở |
| 2026-10-13 | P3-10, P7-01 | **Hoàn thành unit tests** | Tách quy tắc đơn vị nhiên liệu và Decimal VND thành hàm dùng chung; kiểm tra chu kỳ đầy bình, km trống/chồng lấn, quyền truy cập, mốc ngày Việt Nam và xuất file | **27/27 unit tests**; lint, typecheck, Prisma validate đạt; Next production compile và build không-standalone đạt | Chưa test với DB/staging; không suy ra E2E từ unit tests |
| 2026-10-13 | P7-12 | **Hoàn thành bộ tài liệu** | README, Google OAuth setup, deploy HTTPS/Docker, user guide, backup/restore/rollback, release notes; bổ sung script sao lưu, cơ chế in báo cáo | Đối chiếu đường dẫn và nội dung docs; Docker Compose config hợp lệ; Next build non-standalone đạt | Chưa chạy restore thật, chưa xác minh Google OAuth trên production; không đánh dấu P7-07/P7-09 |
| 2026-10-13 | P3-03, P4-02 (gia cố) | Có code và unit tests, **chưa nghiệm thu tích hợp** | Xử lý retry cạnh tranh theo idempotency key ở fuel và maintenance; chỉ nhận lại giao dịch POSTED trùng toàn bộ dữ liệu, từ chối mã dùng cho nội dung khác | Unit kiểm tra lặp, VOID, khác actor/xe/giá/đơn vị; lint/typecheck/build đạt | Cần thử 2 request song song trên PostgreSQL thực; checkbox nghiệp vụ vẫn mở |
| 2026-10-13 | Kiểm chứng môi trường GĐ7 | Bị giới hạn | Compose config với `.env` tạm đạt; không để lại `.env`; build local trên OneDrive dùng `NEXT_BUILD_SKIP_STANDALONE=1`, `NEXT_BUILD_DIR` mới | `npx next build` đạt sau các sửa đổi; build mặc định `prisma generate` gặp EPERM hoặc không tải được engine; Git Bash bị lỗi MSYS permission | Docker daemon không hoạt động; localhost:5432 không có PostgreSQL; chưa kiểm thử standalone container, OAuth, restore, mobile thật |
| 2026-10-13 | P3-08/P3-09, P4-05/P4-06 (rà soát), P5-01/P5-15/P5-17 (bổ sung) | Có code, unit/tĩnh; **chưa đạt DoD tích hợp** | Thống nhất lọc hành trình theo chuyến nằm trọn kỳ, loại bỏ chuyến vượt ranh giới khỏi số km; nhắc giấy tờ tiến triển theo hạn và không mở lại trạng thái đã xử lý; bổ sung so sánh chi phí/xe, tiền nhiên liệu, km, chi phí/km và kỳ trước bằng dữ liệu POSTED/Decimal | **31/31 unit tests**, lint, typecheck, Prisma validate, Next production build non-standalone **đạt** trên Windows | Chưa thử SQL báo cáo/nhắc hạn trên DB thật; cần đối chiếu dashboard/export, OAuth, mobile, scheduler và backup/restore; các checkbox này vẫn mở |
| 2026-10-13 | P4-09, P5-04 (gia cố), P7-13 | **Hoàn thành P7-13; P4-09/P5-04 chưa nghiệm thu tích hợp** | Phân trang giới hạn về trang cuối và thứ tự ổn định; trang chọn bản ghi công việc khi hoàn thành lịch, kiểm tra xe/tổ chức/thời điểm, audit ID; nhãn xe/danh mục dễ đọc trong Excel | **33/33 unit tests**, lint, typecheck, Prisma validate đạt. Next build compile và tạo trang nhưng chưa nhận được exit code bước tracing do công cụ theo dõi bị chặn | Cần PostgreSQL, OAuth, E2E/mobile; xác minh build và thử liên kết lịch trên DB; giữ checkbox nghiệp vụ mở |
| 2026-10-13 | UI redesign toàn bộ route; P6-01–P6-08 (mã nguồn), P7-01 (bổ sung) | **Mã nguồn giao diện/PWA đã triển khai; chưa nghiệm thu browser/E2E** | Design System, app shell, dashboard, mobile nav, forms/lịch sử, xe, báo cáo, login và các trang còn lại; lọc dashboard theo kỳ/xe; thêm PWA shell cache an toàn, chuyển tổ chức trên màn hình Tài khoản điện thoại | **38/38 unit tests**, lint, typecheck, Prisma schema validate, cú pháp SW đạt; build non-standalone bị `EPERM` khi tạo thư mục trong ổ đồng bộ | Chưa có ảnh 390/1440, thiết bị thật, Docker/PostgreSQL, callback Google hoặc restore; bản sao build tạm bị Windows từ chối junction (`Access is denied`), đã dọn; chưa đánh dấu P6-07/P7-03/P7-09 do thiếu nghiệm thu tích hợp |
| 2026-10-13 | P2-08/P5-07/P5-08/P5-09/P6-02/P6-05/P6-08 gia cố | **Hoàn thiện mã nguồn và unit; chưa nghiệm thu E2E** | Nhập VND định dạng dấu chấm và bảo toàn caret; hóa đơn có nút camera riêng, preview/xóa, MIME/5 MB; biểu đồ, tỷ trọng và sắp xếp báo cáo VND chính xác với BigInt; tăng vùng chạm mở thông tin bổ sung; chặn gửi chi phí và nhiên liệu khi báo offline, giữ form để thử lại | **42/42 unit tests**, lint, typecheck, Prisma validate, SW syntax đạt; một lần `npx next build` non-standalone đạt sau sửa tiền/biểu đồ, sau cập nhật offline build lại gặp `EPERM` trên OneDrive | Chưa chạy camera thật, retry trong lỗi mạng ngắt giữa request, kiểm thử đa tenant với PostgreSQL/OAuth, browser screenshots; build cuối cần chạy lại trên ổ local/CI. Không đánh dấu hoàn thành P6-05/P6-09/P7-03 nếu thiếu chứng cứ. |
| 2026-10-13 | P3-02/P6-02 (gia cố nhập nhiên liệu) | **Có code/unit/build; chưa nghiệm thu DB/E2E** | Xem trước tiền nhiên liệu nhân chính xác 3 chữ số thập phân, làm tròn VND một lần theo server; chặn giá trị sau làm tròn bằng 0 hoặc vượt tối đa 999.999.999.999.999 ₫; cảnh báo và giới hạn trên form mobile | **44/44 unit tests**, lint, typecheck, Prisma validate, SW syntax đều đạt; `npx next build` non-standalone với `NEXT_BUILD_DIR=.next-fuel-final-1013` **đạt exit code 0** sau sửa | Cần xác minh form với keyboard điện thoại, request thực tế, số tiền biên và tác vụ fuel/expense trên PostgreSQL; chưa đóng P3-02. `npm run build` mặc định/standalone chưa được thử lại. |
| 2026-10-13 | P4-02/P4-03/P4-04/P6-08, login/dashboard UI (gia cố) | **Đã chỉnh mã nguồn; chưa nghiệm thu browser/DB** | Nhập VND bảo dưỡng có nhóm hàng nghìn và mặc định 0, giữ nguyên giao dịch liên kết phí; ngăn gửi khi offline ở form bảo dưỡng, lịch nhắc, giấy tờ; sửa grid/login mobile và bộ lọc dashboard responsive dùng GET thật | **44/44 unit**, lint, typecheck, Prisma validate, SW syntax **đạt**. `npx next build` non-standalone (`.next-xelog-1013-final-v2`) **exit code 0**, 23 trang static; cần pre-create thư mục output vì OneDrive `EPERM` | Localhost socket bị từ chối; thử Chrome headless báo `Local login route unavailable`, không có screenshot mới đúng viewport. Chưa có OAuth/PostgreSQL, camera hay kiểm thử E2E/standalone; các checkbox nghiệp vụ giữ mở. |
| 2026-10-13 | P2-10/P2-08/P3-06/P3-07/P6-08 và biểu mẫu thành viên (gia cố) | **Có code và build, chưa nghiệm thu E2E** | Dùng chung `useOnlineSubmission`/`OfflineNotice` để chặn gửi khi browser báo offline ở tạo/sửa xe, chi phí, chuyến đi, chỉnh km, mời thành viên và bảo dưỡng; form sửa chi phí dùng `VndAmountInput` và trạng thái nút lưu, tiếp tục gọi `updateExpense` phía server | **44/44 unit tests**, lint, typecheck, Prisma validate đạt; `npx next build` non-standalone (`.next-xelog-1013-final-v3`) **exit code 0**, **23/23 static pages**; bỏ include types tạm trong tsconfig sau build | Cần thử ngắt mạng giữa request và retry, số tiền VND sửa trên thiết bị, quyền trên PostgreSQL/OAuth và browser screenshots. `npm run build` mặc định/standalone, các ca AT-01–AT-22 chưa được xác minh; giữ các checklist nghiệp vụ mở. |
| 2026-10-13 | P7-06/P7-10 (kiểm chứng build chuẩn) | **Chưa xác nhận build mặc định/standalone** | Thử `npm run build` với thư mục Next output mới và pre-create cây route; thử dùng Prisma engine cục bộ để tránh phụ thuộc mạng | Build Next non-standalone trước đó đã **exit 0**; `npm run build` mới **exit 1** tại `prisma generate`, lần đầu `ENOTFOUND binaries.prisma.sh`, lần thử dùng engine cục bộ gặp `EPERM rename` DLL đã có dưới `node_modules/.prisma/client` | Cần chạy trên thư mục không bị OneDrive đồng bộ/khóa DLL hoặc CI có mạng, xác minh `prisma generate`, standalone trace và image Docker trước khi đánh dấu P7-06/P7-10. Không ép xóa file DLL đang dùng. |
| 2026-10-13 | P7-06 (tối ưu Docker build) | **Đã sửa mã nguồn; chưa build image** | Bỏ lần `npx prisma generate` chạy trùng trong builder của Dockerfile; `npm run build` đã bao gồm Prisma generate và Next build | Kiểm tra Dockerfile và script `build` trong `package.json`; không thay đổi runtime hoặc quyền ứng dụng | Docker daemon chưa hoạt động, cần `docker build`/Compose cùng database trên staging trước khi đóng P7-06. |
| 2026-10-13 | P6-01/P7-10 (sửa lỗi chạy dev trên OneDrive) | **Đã sửa cấu hình và kiểm chứng khởi động; HTTP E2E chưa xác minh** | `next.config.mjs` tách `.next-dev` cho development và `.next` cho production, vẫn cho phép `NEXT_BUILD_DIR` override; `npm run dev` tự nạp shim Windows `realpath`; chuẩn hóa `tsconfig.json` loại bỏ đường dẫn types build tạm; cập nhật README | `.next/routes-manifest.json` ban đầu vắng mặt; chạy `npm run dev -- --hostname 127.0.0.1 --port 3113` sau sửa báo **Ready**, tạo `.next-dev/routes-manifest.json`; cấu hình dev/prod/override đều cho đường dẫn đúng; lint, typecheck **đạt** | `curl` từ tiến trình công cụ không kết nối được `127.0.0.1:3113`, chưa xác minh HTTP trong trình duyệt; cần thử ngoài sandbox/localhost thực. Không xóa `.next` cũ hoặc dữ liệu nghiệp vụ. |

| 2026-10-13 | P1-01/P1-02/P7-10, xử lý Auth.js DB runtime | **Đã sửa cấu hình và kiểm thử tĩnh; database chưa xác nhận** | Từ log người dùng phát hiện `PrismaClientInitializationError` không thể kết nối `127.0.0.1:55432`; thêm `scripts/start-dev-db.cjs`, lệnh `db:up`, đổi Compose dev port/user/database/password theo `DATABASE_URL` từ `.env`, sửa mặc định password khớp `.env.example`, cập nhật README; không đổi session strategy hay dữ liệu | **49/49 unit tests**, lint/typecheck, Compose syntax và `db:up -- --check` đạt; `db:up` ban đầu chưa chạy vì Docker Linux API chưa tồn tại; khởi động Docker Desktop process và WSL read-only qua chế độ phù hợp | Chờ xác nhận engine/DB/volume cũ, `prisma migrate status`, Google OAuth/E2E; không xóa volume hoặc tự đổi mật khẩu trong DB cũ |

### 19.2. Trạng thái tổng thể

- [x] **GĐ0** Khảo sát, phân tích, thiết kế.
- [ ] **GĐ1** Hạ tầng phát triển, database, Google Login.
- [ ] **GĐ2** Phương tiện, chi phí, chứng từ và lịch sử.
- [ ] **GĐ3** Nhiên liệu/sạc, hành trình và số km.
- [ ] **GĐ4** Bảo dưỡng, giấy tờ và nhắc hạn.
- [ ] **GĐ5** Dashboard, biểu đồ, báo cáo, Excel/PDF.
- [ ] **GĐ6** Mobile First, PWA, trải nghiệm người dùng.
- [ ] **GĐ7** Kiểm thử, bảo mật, deploy và bàn giao.

---

## 20. Yêu cầu hành động đầu tiên

**Đề nghị AI Coding Agent bắt đầu từ P0-01 → P0-09.** Sau khi kiểm tra repository và hoàn tất tài liệu thiết kế nền tảng, triển khai GĐ1 để xác thực đăng nhập Google và kiểm soát quyền. Tiếp tục GĐ2 để tạo **vòng lặp nghiệp vụ có thể dùng thực tế**, sau đó các module vận hành, báo cáo và triển khai.

**Quy tắc quản lý kế hoạch:** chỉ đánh dấu `[x]` khi task có bằng chứng kiểm thử/xác nhận; khi phát sinh yêu cầu mới, thêm task ID và phụ thuộc rõ ràng, không xóa lịch sử tiến độ. Đây là file triển khai dành cho dự án, không đồng nghĩa các task đã được code xong.
