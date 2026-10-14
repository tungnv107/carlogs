# PROMPT XÂY DỰNG ỨNG DỤNG WEB QUẢN LÝ XE VÀ CHI PHÍ

> **Tên đề xuất:** Vehicle & Expense Manager — Quản lý xe và chi phí vận hành  
> **Mục đích:** Sử dụng prompt này với Codex, OpenCode, Cursor, Claude Code hoặc các AI Coding Agent tương đương để phát triển ứng dụng Web hoàn chỉnh.  
> **Ngôn ngữ giao diện:** Tiếng Việt.  
> **Ưu tiên:** Mobile First, đăng nhập Google (Gmail), quản lý nhiều xe, thống kê chi phí chính xác, báo cáo tổng hợp và chi tiết, triển khai thực tế bằng Docker.

---

## 1. VAI TRÒ VÀ MỤC TIÊU

Bạn là một **Senior Full-stack Developer, Software Architect, Database Architect và UI/UX Designer** có kinh nghiệm xây dựng hệ thống quản lý phương tiện, theo dõi chi phí và báo cáo phân tích dữ liệu (Business Intelligence).

Hãy thiết kế và triển khai một **ứng dụng Web hoàn chỉnh có thể sử dụng trong thực tế**, giúp cá nhân, gia đình, doanh nghiệp nhỏ hoặc tổ chức quản lý nhiều phương tiện và toàn bộ chi phí vận hành.

### Mục tiêu nghiệp vụ

- Quản lý thông tin, tình trạng và hồ sơ từng phương tiện.
- Theo dõi chi phí nhiên liệu, sạc điện, bảo dưỡng, sửa chữa, bảo hiểm, đăng kiểm, phí đường bộ, đỗ xe và chi phí khác.
- Ghi nhận số km, hành trình và các sự kiện vận hành.
- Nhắc lịch bảo dưỡng và thời hạn giấy tờ xe.
- Xem Dashboard có KPI, biểu đồ và bộ lọc thời gian/phương tiện.
- Tạo báo cáo tổng hợp, báo cáo chi tiết, so sánh phương tiện và xuất Excel/PDF/CSV.
- Đăng nhập nhanh, an toàn bằng **tài khoản Google (Gmail)**.
- Hỗ trợ nhiều người dùng, nhiều tổ chức và phân quyền chi tiết nếu cần.
- Thao tác đặc biệt thuận tiện trên điện thoại; hỗ trợ cài đặt như ứng dụng thông qua PWA.

### Nguyên tắc bắt buộc

1. Xây dựng **sản phẩm có các chức năng hoạt động thực**, không phải UI demo hoặc giao diện tĩnh.
2. **Mobile First**: ưu tiên quy trình nhập chi phí nhanh bằng một tay.
3. Dữ liệu nghiệp vụ, KPI, báo cáo và biểu đồ lấy từ database; không dùng hardcoded metrics.
4. **Một khoản chi phí chỉ được tính một lần**, dù có liên kết dữ liệu nhiên liệu/bảo dưỡng/sửa chữa.
5. Mọi truy vấn và cập nhật phải kiểm tra quyền truy cập tại backend.
6. Thiết kế có thể bảo trì, nâng cấp, backup và triển khai trên VPS.
7. Tập trung hoàn thiện tính năng cốt lõi trước khi mở rộng.
8. Giao diện tiếng Việt, định dạng tiền tệ VND và múi giờ `Asia/Ho_Chi_Minh`.

---

## 2. CÔNG NGHỆ ĐỀ XUẤT

### Frontend

- **Next.js** với App Router.
- React + TypeScript.
- Tailwind CSS + shadcn/ui.
- Lucide Icons.
- Recharts cho biểu đồ.
- React Hook Form + Zod cho nhập liệu và validation.
- TanStack Query khi thực sự cần quản lý server state.

### Backend và dữ liệu

- Next.js Server Actions hoặc Route Handlers, lựa chọn nhất quán theo mô-đun.
- Prisma ORM.
- PostgreSQL.
- Object storage hoặc thư mục lưu trữ được cấu hình an toàn cho ảnh hóa đơn và tài liệu.
- Job scheduler phù hợp để nhắc hạn (không phụ thuộc việc người dùng đang mở website).

### Authentication

- **Google OAuth 2.0 / OpenID Connect** qua **Auth.js (NextAuth)** hoặc thư viện tương đương được duy trì tốt.
- Session an toàn; kiểm tra Google account identity qua provider ID (`sub`).
- Hỗ trợ phân quyền dựa trên vai trò (RBAC) và phạm vi tổ chức.
- **Đăng nhập bằng Google là chức năng bắt buộc và phải hoạt động end-to-end.**

### Triển khai

- Docker + Docker Compose.
- VPS Ubuntu.
- Reverse proxy Nginx/Nginx Proxy Manager hoặc tương đương.
- HTTPS/TLS, cấu hình `.env`, migration, backup/restore.
- Progressive Web App (PWA) phục vụ điện thoại.

**Lưu ý:** Nếu repository hiện có đã dùng một stack tương thích, hãy đánh giá và ưu tiên kế thừa; tránh thay đổi kiến trúc chỉ vì sở thích công nghệ. Ưu tiên modular monolith, chưa cần microservices.

---

## 3. ĐĂNG NHẬP GOOGLE (GMAIL) — BẮT BUỘC

### 3.1. Màn hình đăng nhập

Thiết kế màn hình đăng nhập hiện đại, chuyên nghiệp, responsive với:

- Logo và tên ứng dụng: **Quản lý xe và chi phí**.
- Mô tả ngắn tính năng chính.
- Nút **“Tiếp tục với Google”** có biểu tượng Google rõ ràng.
- Trạng thái đang đăng nhập, thất bại, bị từ chối, hết phiên đăng nhập và thử lại.
- Thông báo ngắn về điều khoản sử dụng/chính sách quyền riêng tư khi phù hợp.
- Tương thích cả máy tính và điện thoại; không bị tràn màn hình nhỏ.

**Không yêu cầu xây dựng đăng nhập bằng email/mật khẩu trong phiên bản đầu tiên**. Gmail ở đây có nghĩa là đăng nhập bằng tài khoản Google, bao gồm cả tài khoản Google Workspace hợp lệ nếu hệ thống cho phép; **không yêu cầu quyền đọc Gmail, email hoặc Google Drive**.

### 3.2. Quy trình đăng nhập Google

1. Người dùng mở website và chọn **Tiếp tục với Google**.
2. Hệ thống chuyển đến trang xác thực của Google qua OAuth 2.0/OpenID Connect.
3. Sau khi xác thực thành công, Google chuyển người dùng về callback của ứng dụng.
4. Backend xác minh phản hồi, token/claims cần thiết và trạng thái xác thực email theo cơ chế của thư viện đăng nhập.
5. Xác định người dùng thông qua `provider = google` và **Google subject/providerAccountId**, không chỉ dựa vào địa chỉ email.
6. Nếu người dùng chưa có tài khoản ứng dụng, tạo hồ sơ với thông tin tối thiểu đã được phép truy cập: tên, email, ảnh đại diện, provider ID.
7. Nếu đã có tài khoản, cập nhật các trường hồ sơ phù hợp mà không làm thay đổi quyền hay tổ chức.
8. Tạo session an toàn và chuyển người dùng đến Dashboard hoặc trang onboarding nếu cần.
9. Cho phép **Đăng xuất**, hủy session trên ứng dụng và quay về màn hình đăng nhập.
10. Nếu session hết hạn, xử lý nhẹ nhàng, hướng dẫn đăng nhập lại và bảo toàn dữ liệu form chưa gửi trong phạm vi có thể.

### 3.3. Quy định cấp quyền khi đăng nhập lần đầu

- Không mặc định cấp quyền `Administrator` cho người mới.
- Có luồng bootstrap bảo mật để khởi tạo quản trị viên đầu tiên, dựa trên cấu hình triển khai hoặc một thủ tục setup chỉ chạy một lần; không sử dụng email Google cố định hardcoded trong source.
- Hỗ trợ một trong hai mô hình, có thể cấu hình:
  - **Cá nhân:** người dùng tạo không gian quản lý riêng, mặc định là chủ sở hữu không gian đó.
  - **Tổ chức:** người dùng mới chỉ được tham gia tổ chức qua lời mời hoặc được quản trị viên chấp thuận.
- Không tự động cho người dùng mới truy cập vào dữ liệu của tổ chức chỉ vì cùng domain email.
- Các quyền và phân công phương tiện được lưu tại database của ứng dụng, **không lấy từ Google**.
- Nếu tài khoản bị vô hiệu hóa trong ứng dụng thì đăng nhập Google thành công cũng không đồng nghĩa được phép sử dụng dữ liệu ứng dụng.

### 3.4. Liên kết tài khoản và an toàn bảo mật

- Liên kết tài khoản Google dựa trên định danh provider đáng tin cậy; không tự động gộp hai tài khoản chỉ do email giống nhau mà chưa xác minh đầy đủ.
- Kiểm tra `email_verified` khi sử dụng email làm cơ sở cho quy trình mời hoặc liên kết.
- Chỉ yêu cầu OAuth scopes tối thiểu: `openid`, `email`, `profile`, trừ khi có nghiệp vụ bổ sung thực sự cần thiết.
- Không yêu cầu quyền truy cập hộp thư Gmail.
- Không lưu access token/refresh token Google nếu ứng dụng không cần sử dụng Google API về sau.
- Không đưa client secret, session secret hoặc token nhạy cảm vào frontend, log công khai hoặc repository.
- Áp dụng các bảo vệ do thư viện cung cấp: `state`, `nonce`, PKCE khi phù hợp, kiểm soát callback URL, cookies an toàn và CSRF.
- Có cơ chế xử lý khi tài khoản Google đổi ảnh/tên/email; quyền tổ chức vẫn ổn định theo định danh tài khoản.
- Hỗ trợ session expiration, logout và thu hồi/khóa quyền truy cập từ quản trị viên.
- Audit log cho các thao tác đăng nhập và thay đổi phân quyền quan trọng, tránh lưu token nhạy cảm.

### 3.5. Cấu hình Google Cloud

Tạo tài liệu `docs/GOOGLE_LOGIN_SETUP.md` hướng dẫn đầy đủ:

1. Tạo/chọn project trong Google Cloud Console.
2. Cấu hình OAuth consent screen / Google Auth Platform (nếu cần, phù hợp giao diện hiện hành).
3. Tạo OAuth client type **Web application**.
4. Khai báo Authorized JavaScript origins và Authorized redirect URIs chính xác cho môi trường dev và production.
5. Nếu dùng Auth.js với endpoint mặc định, ví dụ callback: `http://localhost:3000/api/auth/callback/google` khi phát triển và `https://your-domain.example/api/auth/callback/google` khi triển khai; **phải đối chiếu với route/cấu hình thực tế**.
6. Thiết lập `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` hoặc tên biến môi trường thư viện đang sử dụng; cấu hình `AUTH_SECRET` và URL/host liên quan theo phiên bản sử dụng.
7. Thiết lập HTTPS cho môi trường production.
8. Hướng dẫn thêm test users nếu ứng dụng OAuth còn ở trạng thái testing.
9. Hướng dẫn kiểm tra `redirect_uri_mismatch`, lỗi OAuth consent, session và proxy headers.

Tạo `.env.example` chỉ có biến mẫu và chú thích, không chứa secrets thật.

### 3.6. Tiêu chí nghiệm thu Google Login

- Đăng nhập Google thành công trên desktop, Android và iPhone (trình duyệt tương thích).
- Sau lần đăng nhập đầu, tài khoản được tạo trong database và không bị tạo trùng khi đăng nhập lại.
- Ảnh đại diện/tên người dùng hiển thị đúng ở topbar/menu.
- Phân quyền được kiểm soát độc lập với đăng nhập Google.
- Người chưa được phép không xem được dữ liệu tổ chức khác kể cả khi biết URL/ID.
- Đăng xuất và đăng nhập lại hoạt động chính xác.
- Không có Google credentials/secret trong client bundle hoặc repository.
- Nếu Google từ chối xác thực, ứng dụng báo lỗi dễ hiểu và cho phép thử lại.

---

## 4. QUẢN LÝ PHƯƠNG TIỆN

### 4.1. Danh sách phương tiện

Hiển thị phương tiện dưới dạng Card trên điện thoại, bảng/danh sách linh hoạt trên desktop.

Thông tin:

- Biển kiểm soát, tên xe, hình ảnh xe.
- Loại xe: ô tô, xe máy, xe tải hoặc loại khác.
- Hãng, dòng xe, phiên bản, năm sản xuất, màu sắc.
- Loại nhiên liệu: xăng, diesel, điện, hybrid, khác.
- Dung tích bình nhiên liệu (nếu có).
- Số km hiện tại.
- Ngày mua, giá mua (tùy chọn).
- Người phụ trách hoặc người sử dụng.
- Trạng thái: đang sử dụng, bảo dưỡng, tạm ngừng, ngừng sử dụng.
- Ghi chú.

Chức năng: thêm, xem, sửa, lưu trữ/ngừng sử dụng, tìm kiếm, lọc, sắp xếp, upload ảnh; hạn chế xóa vĩnh viễn xe đã có giao dịch.

### 4.2. Hồ sơ chi tiết xe

Mỗi xe có trang riêng với các tab/section:

- **Tổng quan:** thông tin xe, tổng chi phí, chi phí kỳ hiện tại, km và chi phí/km.
- **Chi phí:** danh sách giao dịch theo xe, lọc theo danh mục và thời gian.
- **Nhiên liệu:** lịch sử đổ xăng/dầu/sạc điện, mức tiêu hao khi đủ dữ liệu.
- **Hành trình:** quãng đường, mục đích, người sử dụng.
- **Bảo dưỡng & sửa chữa:** các lần bảo dưỡng, linh kiện thay, chi phí.
- **Giấy tờ:** đăng kiểm, bảo hiểm, các hạn cần theo dõi.
- **Báo cáo:** biểu đồ xu hướng theo thời gian và cơ cấu chi phí.

Tất cả dữ liệu liên kết theo `vehicleId` và `organizationId`/owner context phù hợp.

---

## 5. QUẢN LÝ CHI PHÍ — PHÂN HỆ TRỌNG TÂM

### 5.1. Danh mục chi phí mặc định

| Nhóm | Danh mục ví dụ |
|---|---|
| Nhiên liệu / năng lượng | Xăng, dầu diesel, sạc điện |
| Bảo dưỡng | Thay dầu, lọc dầu, lọc gió, lốp, bảo dưỡng định kỳ |
| Sửa chữa | Động cơ, hệ thống điện, phanh, điều hòa, gầm |
| Phí sử dụng | Cầu đường, cao tốc, gửi xe, bến bãi, rửa xe |
| Chi phí định kỳ | Bảo hiểm, đăng kiểm, phí bảo trì đường bộ, thuế/lệ phí |
| Chi phí khác | Phụ kiện, cứu hộ, vi phạm giao thông, phát sinh khác |

Cho phép quản trị viên tùy chỉnh danh mục; có thể ẩn/khóa danh mục đã từng được sử dụng thay vì xóa làm mất tham chiếu.

### 5.2. Thêm khoản chi phí

Trường dữ liệu:

- Phương tiện.
- Ngày phát sinh (mặc định ngày hiện tại).
- Danh mục/nhóm chi phí.
- Số tiền (VND).
- Đồng hồ km tại thời điểm ghi nhận (tùy danh mục).
- Nội dung và ghi chú.
- Nhà cung cấp/đơn vị thực hiện.
- Người ghi nhận.
- Hình thức thanh toán.
- Ảnh chứng từ/hóa đơn (camera hoặc thư viện).

**Yêu cầu UX Mobile:**

- Nút **+ Thêm chi phí** dễ bấm từ mọi màn hình chính.
- Bàn phím số cho số tiền, định dạng `vi-VN`.
- Gợi ý xe gần nhất, danh mục thường dùng và giá trị phù hợp.
- Nút **Lưu** / **Lưu và thêm tiếp**.
- Báo lỗi theo trường, không làm mất dữ liệu đã nhập.
- Upload ảnh nhanh; có preview ảnh và thông báo kết quả.
- Giảm số bước nhưng không bỏ xác nhận với các thao tác phá hủy dữ liệu.

### 5.3. Lịch sử chi phí

- Lọc theo ngày, tuần, tháng, quý, năm hoặc khoảng tùy chỉnh.
- Lọc theo xe, danh mục, người ghi nhận, nhà cung cấp và khoảng tiền.
- Tìm kiếm diễn giải.
- Phân trang, sắp xếp.
- Xem chứng từ; sửa/xóa/khôi phục theo phân quyền.
- Xuất Excel/CSV các giao dịch đã lọc.
- Card trên mobile, table trên desktop.

### 5.4. Quy tắc tính toán

- Tiền lưu bằng `Decimal/Numeric` hoặc đơn vị tiền nhỏ nhất theo thiết kế thống nhất; không dùng floating point cho số tiền.
- Có `transactionDate` (ngày phát sinh) và `createdAt` (ngày tạo); báo cáo mặc định dùng ngày phát sinh.
- Chi phí được xác định theo trạng thái nghiệp vụ rõ ràng: bản nháp/chờ duyệt/đã ghi nhận/hủy nếu triển khai quy trình duyệt.
- Chỉ các giao dịch đủ điều kiện mới được cộng vào KPI; quy tắc phải được dùng thống nhất bởi Dashboard và báo cáo.
- Cần audit log khi sửa/hủy giao dịch.
- **Không tính trùng**: nếu ghi nhận một lần đổ xăng ở `fuel_logs` thì chi phí chỉ xuất hiện một lần trong sổ chi phí thống nhất.

---

## 6. QUẢN LÝ NHIÊN LIỆU VÀ SẠC ĐIỆN

Các trường: xe, ngày giờ, km, nhiên liệu/nguồn năng lượng, số lít/kWh, đơn giá, tổng tiền, trạm xăng/trạm sạc, trạng thái đầy bình (nếu áp dụng), hóa đơn.

### Công thức

- `Thành tiền = Số lượng × Đơn giá`.
- `Chi phí nhiên liệu/km = Tổng chi phí nhiên liệu hợp lệ trong kỳ / Tổng km hợp lệ tương ứng`.
- Với xe dùng nhiên liệu lỏng: `L/100km = Lượng nhiên liệu tiêu thụ hợp lệ / Quãng đường tương ứng × 100`.
- Với xe điện: `kWh/100km = Điện năng tiêu thụ hợp lệ / Quãng đường tương ứng × 100`.

**Quan trọng:** Không suy diễn mức tiêu hao chỉ từ một hóa đơn nhiên liệu khi thiếu mốc km hoặc không có chu kỳ đo tương thích. Với phương pháp đổ đầy bình, chỉ báo cáo mức tiêu hao khi có chu kỳ **đầy bình → đầy bình** hợp lệ. Hiển thị “Chưa đủ dữ liệu” thay vì `0` nếu không thể tính.

Chức năng:

- Thống kê số lần đổ nhiên liệu/sạc.
- Tổng tiền, tổng lượng nhiên liệu/năng lượng.
- Giá bình quân theo đơn vị.
- Chi phí/km.
- Biểu đồ theo tháng, so sánh xe.
- Cảnh báo chỉ số km bất thường, trường hợp thiếu dữ liệu.
- Phân biệt rõ lít và kWh; không cộng trực tiếp hai đơn vị này.

---

## 7. HÀNH TRÌNH VÀ SỐ KM

Ghi nhận:

- Xe, người sử dụng/lái xe.
- Thời gian bắt đầu/kết thúc.
- Km đầu và km cuối.
- Quãng đường tự tính.
- Mục đích sử dụng.
- Ghi chú.

Quy tắc:

- `Quãng đường = Km cuối - Km đầu`.
- Km cuối phải lớn hơn hoặc bằng km đầu.
- Phát hiện các hành trình bị chồng lấn hoặc mốc km bất thường.
- Cho phép điều chỉnh đồng hồ km qua quy trình có lý do và lịch sử kiểm toán.
- Tránh tính trùng quãng đường khi có nhiều nguồn dữ liệu.
- Nêu rõ cách chọn mẫu số km theo kỳ tính chi phí/km; không tự động dùng số km cuối kỳ trừ đầu kỳ khi dữ liệu không đáng tin cậy.

---

## 8. BẢO DƯỠNG, SỬA CHỮA, GIẤY TỜ VÀ NHẮC HẠN

### 8.1. Lịch sử bảo dưỡng/sửa chữa

- Xe, ngày thực hiện, km.
- Hạng mục, mô tả công việc.
- Nhà cung cấp/garage.
- Phụ tùng thay thế.
- Tổng chi phí và chứng từ.
- Ghi chú, người tạo.

Mỗi bản ghi có thể tham chiếu một giao dịch chi phí duy nhất, tránh cộng trùng.

### 8.2. Lịch bảo dưỡng

Cấu hình theo:

- Thời gian: ví dụ sau 6 tháng.
- Số km: ví dụ sau 5.000 km.
- Kết hợp thời gian và km, theo quy tắc đến hạn trước.

Trạng thái: bình thường, sắp đến hạn, đến hạn, quá hạn, đã hoàn thành. Các ngưỡng cảnh báo phải tùy chỉnh.

### 8.3. Giấy tờ xe

- Đăng kiểm.
- Bảo hiểm trách nhiệm dân sự.
- Bảo hiểm thân vỏ.
- Phí bảo trì đường bộ.
- Giấy tờ khác.

Theo dõi ngày bắt đầu, ngày hết hạn, ảnh/tệp đính kèm, trạng thái và số ngày còn lại.

### 8.4. Thông báo

- Notification Center trong ứng dụng.
- Cảnh báo trên Dashboard và hồ sơ xe.
- Tùy chọn nhận email nhắc hạn nếu được bật và cấu hình dịch vụ gửi email riêng; **không tự ý sử dụng Gmail API của người dùng**.
- Có lịch chạy định kỳ phía server, tránh gửi trùng thông báo.

---

## 9. DASHBOARD TỔNG QUAN VÀ BIỂU ĐỒ

### 9.1. Bộ lọc chung

- Hôm nay, 7 ngày gần nhất.
- Tháng này, tháng trước.
- Quý này, năm nay.
- Khoảng ngày tùy chọn.
- Một xe, nhiều xe hoặc tất cả xe được phép xem.
- Bộ lọc danh mục (nếu phù hợp).

Các KPI, biểu đồ và bảng số liệu phải đồng bộ với bộ lọc. Người dùng chỉ thấy dữ liệu đúng quyền.

### 9.2. KPI Cards

1. Tổng số phương tiện.
2. Tổng chi phí kỳ đang xem.
3. Chi phí nhiên liệu/năng lượng.
4. Chi phí bảo dưỡng và sửa chữa.
5. Tổng km hợp lệ.
6. Chi phí bình quân/km (nếu tính được).
7. Số xe cần bảo dưỡng.
8. Số giấy tờ sắp hoặc đã hết hạn.

Mỗi card hiển thị đơn vị, biểu tượng, giá trị nổi bật và tỷ lệ so với kỳ trước nếu có dữ liệu phù hợp. Phân biệt tỷ lệ không xác định, không có dữ liệu và giá trị `0`.

### 9.3. Hệ thống biểu đồ

| Biểu đồ | Loại gợi ý | Ý nghĩa |
|---|---|---|
| Chi phí theo thời gian | Line/Area | Xu hướng chi phí ngày/tháng/năm |
| Cơ cấu chi phí | Donut | Tỷ trọng nhóm chi phí |
| Chi phí từng phương tiện | Bar | So sánh giữa các xe |
| Nhiên liệu/điện năng | Line/Bar | Chi phí và sản lượng qua thời gian |
| Chi phí/km | Line | Xu hướng hiệu quả vận hành |
| Top xe chi phí cao | Horizontal Bar | Top 5/10 xe theo tổng chi phí |

Yêu cầu:

- Dữ liệu thật từ backend/database.
- Tương tác tooltip, legend, filter và chọn kỳ.
- Hiển thị VND, km, lít, kWh chính xác.
- Responsive hoàn toàn; không tràn màn hình mobile.
- Có empty state khi không có dữ liệu.
- Màu và ngữ nghĩa màu nhất quán, đủ tương phản.
- Có bảng/danh sách số liệu thay thế trong trường hợp người dùng khó đọc biểu đồ.

---

## 10. BÁO CÁO TỔNG HỢP, CHI TIẾT VÀ SO SÁNH

### 10.1. Báo cáo tổng hợp chi phí

Có bộ lọc theo thời gian, xe, nhóm chi phí và tổ chức (trong phạm vi được phép). Nội dung:

- Tổng chi phí toàn kỳ.
- Tổng chi phí từng xe.
- Chi phí theo danh mục.
- Chi phí từng tháng.
- Tổng quãng đường hợp lệ.
- Chi phí/km.
- Tỷ trọng các nhóm.
- So sánh kỳ trước với kỳ hiện tại.

### 10.2. Báo cáo chi tiết chi phí

Các cột:

`STT | Ngày phát sinh | Xe | Biển số | Danh mục | Nội dung | Km | Số tiền | Nhà cung cấp | Người ghi nhận | Chứng từ | Ghi chú`

Có tổng cuối bảng, bộ lọc, phân trang, sắp xếp; xuất dữ liệu đầy đủ theo bộ lọc chứ không chỉ trang đang hiển thị (trừ khi người dùng chọn xuất trang hiện tại).

### 10.3. Báo cáo theo phương tiện

- Tổng chi phí và chi tiết nhóm.
- Tổng chi phí nhiên liệu.
- Tổng sửa chữa, bảo dưỡng.
- Phí sử dụng và chi phí khác.
- Quãng đường đã đi.
- Chi phí/km.
- Biểu đồ thời gian và tỷ trọng danh mục.

### 10.4. Báo cáo nhiên liệu/năng lượng

- Tổng lần đổ/sạc.
- Tổng lượng lít/kWh và số tiền.
- Đơn giá bình quân.
- Mức tiêu hao nếu đủ dữ liệu hợp lệ.
- Chi phí/km.

### 10.5. Báo cáo so sánh

- Xe A với xe B hoặc nhiều xe.
- Tháng này với tháng trước.
- Năm này với năm trước.
- So sánh theo nhóm chi phí.
- So sánh chi phí/km và mức tiêu hao trên các xe có cùng cơ sở tính.

### 10.6. Xuất báo cáo

- Excel (`.xlsx`) có tiêu đề, khoảng thời gian, bộ lọc, dòng tổng, định dạng số VND, ngày tháng và độ rộng cột hợp lý.
- PDF có bố cục in đẹp, hỗ trợ tiếng Việt có dấu.
- CSV khi phù hợp.
- Nút In hoặc bản in thân thiện.
- File xuất phải phản ánh đúng dữ liệu và quyền của người dùng.
- Không đưa link nội bộ/chứng từ nhạy cảm ra file xuất nếu không phù hợp quyền truy cập.

---

## 11. UI/UX MOBILE FIRST

### 11.1. Phong cách chung

- Modern SaaS / Finance Analytics Dashboard.
- Minimal, clean, dễ đọc, chuyên nghiệp.
- Màu chủ đạo: xanh navy và xanh dương; màu nhấn teal/emerald.
- Có Light Mode và Dark Mode.
- Dùng typography rõ ràng, hỗ trợ tốt dấu tiếng Việt.
- Hệ thống icon thống nhất.
- Loading, skeleton, error, empty và success states.

### 11.2. Desktop

- Sidebar trái nhóm theo chức năng.
- Topbar: tìm kiếm, thông báo, avatar Google, tài khoản và đăng xuất.
- Dashboard dạng grid KPI/chart/table.
- Bảng hỗ trợ lọc, sắp xếp, phân trang.
- Form và dialog phù hợp kích thước màn hình.

### 11.3. Mobile

**Bottom Navigation cố định** gồm:

1. Tổng quan.
2. Phương tiện.
3. **+ Thêm chi phí** (điểm nhấn chính).
4. Lịch sử.
5. Menu.

Tiêu chí:

- Tối ưu thao tác một tay.
- Các vùng chạm nên đạt ít nhất khoảng `44 × 44 CSS px`.
- Form một cột, trường nhập lớn, keypad số phù hợp.
- Bộ lọc/selector ở Bottom Sheet hoặc màn hình chọn riêng.
- Upload ảnh bằng camera hoặc thư viện.
- Không để bàn phím ảo che trường nhập.
- Hỗ trợ safe-area iPhone/Android.
- Dữ liệu dạng Card thay cho bảng rộng.
- Không có scroll ngang toàn trang do lỗi responsive.
- Biểu đồ co giãn và điều chỉnh nhãn phù hợp màn hình nhỏ.
- Người dùng có thể vào màn hình thêm chi phí từ Dashboard với 1 thao tác chính.
- Duy trì trạng thái bộ lọc và ngữ cảnh xe hợp lý trong phiên sử dụng.

### 11.4. Breakpoints kiểm thử

`360px`, `390px`, `768px`, `1366px`, `1920px` và các kích thước phổ biến tương tự.

### 11.5. PWA

- Manifest, icon và standalone display.
- Cài lên Home Screen.
- Cache tài nguyên tĩnh phù hợp.
- Trang fallback khi mất mạng.
- Chỉ triển khai ghi dữ liệu offline nếu có cơ chế queue, đồng bộ chống trùng và xử lý xung đột thực sự an toàn.

---

## 12. QUẢN LÝ NGƯỜI DÙNG VÀ PHÂN QUYỀN

### Vai trò đề xuất

| Vai trò | Phạm vi mặc định |
|---|---|
| Owner/Administrator | Thiết lập tổ chức, thành viên, quyền và toàn bộ xe thuộc tổ chức |
| Manager | Quản lý xe, vận hành, xem báo cáo theo quyền |
| Accountant | Quản lý/đối soát chi phí và xuất báo cáo theo quyền |
| Driver/User | Ghi nhận chi phí, nhiên liệu, hành trình trên xe được phân công |
| Viewer | Chỉ xem dữ liệu/báo cáo trong phạm vi được cấp |

- Quyền phải kiểm tra ở server và database query, không chỉ ẩn nút ở frontend.
- Hỗ trợ lời mời tham gia tổ chức dựa trên email Google đã được xác minh.
- Thành viên có thể thuộc nhiều tổ chức nếu được mời; có cơ chế chuyển tổ chức đang hoạt động.
- Các `vehicleId`, `expenseId`, `organizationId` do client truyền lên phải được kiểm tra quyền.
- Có màn hình quản lý thành viên, trạng thái, lời mời, thu hồi quyền.
- Quy trình thay đổi role, chuyển chủ sở hữu và vô hiệu hóa tài khoản cần bảo vệ bằng authorization và audit log.

---

## 13. THIẾT KẾ DATABASE

Thiết kế PostgreSQL schema với Prisma, có khóa chính, khóa ngoại, unique constraints, indexes và migrations.

### Các bảng đề xuất

- `organizations`
- `users`
- `accounts` — liên kết OAuth Google theo schema Auth.js/thư viện tương ứng.
- `sessions` — nếu dùng database session.
- `verification_tokens` — chỉ khi thư viện/cơ chế auth yêu cầu.
- `organization_members`
- `invitations`
- `roles` / `permissions` hoặc mô hình RBAC phù hợp.
- `vehicles`
- `vehicle_assignments`
- `drivers`
- `expense_categories`
- `expenses` — **nguồn dữ liệu tài chính chính**.
- `fuel_logs`
- `maintenance_records`
- `maintenance_schedules`
- `repair_records`
- `trip_logs`
- `vehicle_documents`
- `vendors`
- `attachments`
- `notifications`
- `audit_logs`
- `app_settings`

### Quy tắc thiết kế

1. Mỗi user có ID nội bộ, liên kết với Google provider ID qua bảng `accounts`; email có thể thay đổi nên không dùng email làm khóa định danh OAuth duy nhất.
2. Dữ liệu xe, chi phí và báo cáo có owner/organization scope rõ ràng.
3. Sử dụng `createdAt`, `updatedAt`, `createdBy`/`updatedBy` hợp lý.
4. Soft-delete hoặc cơ chế lưu trữ lịch sử cho dữ liệu tài chính.
5. Số tiền dùng `Decimal/Numeric`; lượng nhiên liệu và số km có kiểu/độ chính xác phù hợp.
6. `expenses` làm nguồn tài chính thống nhất; `fuel_logs`/`maintenance_records`/`repair_records` tham chiếu chi phí tương ứng, tránh cộng trùng.
7. Các quan hệ nghiệp vụ quan trọng có constraint để tránh liên kết sai tổ chức.
8. Index trên `organizationId`, `vehicleId`, `transactionDate`, `categoryId`, trạng thái chi phí và các trường truy vấn thường xuyên.
9. Thời gian lưu theo chuẩn phù hợp timezone; hiển thị theo `Asia/Ho_Chi_Minh`.
10. Seed data chỉ dùng cho development/test; không tự động nạp giao dịch giả vào production.

Đề xuất thêm sơ đồ ERD, bảng mô tả field quan trọng và giải thích chiến lược tránh tính trùng chi phí.

---

## 14. API, BUSINESS LOGIC VÀ VALIDATION

Xây dựng các module rõ ràng:

- Authentication và session.
- Organizations, membership, invitations và RBAC.
- CRUD phương tiện.
- CRUD chi phí/danh mục.
- Ghi nhận nhiên liệu và sạc điện.
- Quản lý hành trình/km.
- Bảo dưỡng, sửa chữa, giấy tờ và nhắc hạn.
- Tổng hợp KPI/biểu đồ/báo cáo.
- Xuất Excel/PDF/CSV.
- Upload và tải tài liệu theo quyền.

Yêu cầu:

- Zod/server-side validation cho mọi dữ liệu đầu vào.
- Authentication và authorization cho từng hành động.
- Transaction khi thao tác nhiều bảng liên quan.
- Idempotency hoặc cơ chế chống gửi trùng trên thao tác tạo chi phí/nhiên liệu.
- Pagination/filter/sort ở backend.
- Bộ hàm tính toán tài chính dùng chung cho Dashboard, reports và exports.
- Xử lý chuẩn việc nhóm dữ liệu theo timezone và ranh giới ngày/tháng.
- Thông báo lỗi có thể hiểu được; tránh tiết lộ stack trace hoặc secrets cho người dùng.

---

## 15. BẢO MẬT, HIỆU NĂNG VÀ VẬN HÀNH

### Bảo mật

- Google OIDC và session được cấu hình đúng môi trường.
- Kiểm tra đầy đủ truy cập chéo tổ chức (tenant isolation).
- Bảo vệ CSRF/XSS/SQL injection qua framework và kiểm tra bổ sung khi cần.
- Rate limiting cho endpoint nhạy cảm.
- File upload được xác thực kiểu, kích thước, lưu an toàn; không cho truy cập trái phép chứng từ.
- Secrets trong environment; không commit `.env` thực.
- Audit log cho thay đổi chi phí, quyền, thành viên và cấu hình.
- Nguyên tắc tối thiểu quyền (least privilege).

### Hiệu năng

- Server-side pagination.
- Index phục vụ lọc và tổng hợp.
- Debounce tìm kiếm.
- Lazy-loading phần giao diện nặng.
- Cache có chiến lược invalidation sau khi ghi dữ liệu.
- Không tải toàn bộ giao dịch xuống client để tính báo cáo.
- Tối ưu ảnh và Core Web Vitals cơ bản.

### Vận hành

- Docker Compose cho ứng dụng và PostgreSQL (có volume bền vững).
- Health check.
- Migration khi deploy và quy trình rollback an toàn.
- Backup database định kỳ và hướng dẫn restore.
- HTTPS khi triển khai thật.
- Logging có cấu trúc, không log token hoặc secrets.
- `.env.example`, README, hướng dẫn vận hành.

---

## 16. CẤU TRÚC MENU

### Desktop Sidebar

**TỔNG QUAN**
- Dashboard.

**QUẢN LÝ**
- Phương tiện.
- Chi phí.
- Nhiên liệu.
- Hành trình.
- Bảo dưỡng & sửa chữa.
- Giấy tờ & nhắc hạn.

**BÁO CÁO**
- Tổng hợp chi phí.
- Chi tiết chi phí.
- Báo cáo theo xe.
- Báo cáo nhiên liệu.
- So sánh phương tiện.

**HỆ THỐNG**
- Thành viên & phân quyền.
- Danh mục.
- Cài đặt.

Topbar hiển thị tên, avatar lấy từ Google, tổ chức đang chọn, thông báo, **Đăng xuất**.

### Mobile

Bottom navigation: **Tổng quan | Xe | + Chi phí | Lịch sử | Menu**. Các mục phụ nằm trong Menu và được nhóm ngắn gọn.

---

## 17. QUY TRÌNH TRIỂN KHAI THEO GIAI ĐOẠN

### Giai đoạn 1 — Nền tảng và Google Login

- Kiểm tra repository và stack hiện tại.
- Thiết kế module, cơ sở dữ liệu và migrations.
- Cấu hình PostgreSQL, Prisma và environment.
- Tích hợp **Google OAuth/OIDC** và màn hình đăng nhập.
- Hoàn thiện user provisioning, session, logout, bootstrap admin, organization scope.
- Thiết kế layout responsive, menu desktop/mobile.
- Viết tài liệu `docs/GOOGLE_LOGIN_SETUP.md`.

**Đầu ra nghiệm thu:** người dùng đăng nhập được bằng Google, truy cập Dashboard trống đúng quyền và đăng xuất được.

### Giai đoạn 2 — Phương tiện và chi phí

- CRUD phương tiện.
- Danh mục chi phí.
- Thêm/sửa/xóa có kiểm soát chi phí.
- Upload chứng từ.
- Lịch sử chi phí và bộ lọc.

**Đầu ra nghiệm thu:** tạo xe, thêm chi phí và thấy dữ liệu tồn tại sau reload.

### Giai đoạn 3 — Nhiên liệu và vận hành

- Đổ nhiên liệu/sạc điện.
- Ghi nhận số km và hành trình.
- Bảo dưỡng/sửa chữa.
- Giấy tờ và nhắc hạn.
- Kiểm thử tránh cộng trùng.

### Giai đoạn 4 — Dashboard và báo cáo

- KPI thật từ database.
- Biểu đồ có bộ lọc.
- Báo cáo tổng hợp/chi tiết/theo xe/nhiên liệu/so sánh.
- Xuất Excel/PDF/CSV.
- Kiểm thử tính nhất quán giữa Dashboard, danh sách và exports.

### Giai đoạn 5 — Mobile và PWA

- Tinh chỉnh Mobile First.
- Bottom Navigation, Bottom Sheets, form nhập nhanh.
- Chụp ảnh chứng từ.
- Dark Mode và PWA.
- Kiểm thử màn hình nhỏ và cảm ứng.

### Giai đoạn 6 — Testing và triển khai

- Unit tests, integration tests, end-to-end tests.
- Kiểm thử truy cập chéo tổ chức và phân quyền.
- Kiểm thử Google Login thật trên môi trường được cấu hình OAuth.
- Docker Compose, reverse proxy, tài liệu Ubuntu.
- Hướng dẫn backup/restore và vận hành.

---

## 18. KỊCH BẢN KIỂM THỬ VÀ TIÊU CHÍ NGHIỆM THU

Tối thiểu phải có các kịch bản sau:

1. Người dùng mới đăng nhập Google, tạo tài khoản nội bộ đúng cách.
2. Người dùng cũ đăng nhập lại Google, **không sinh tài khoản trùng**.
3. Người dùng chưa có quyền không xem/sửa dữ liệu tổ chức khác, kể cả khi nhập URL trực tiếp.
4. Quản trị viên mời thành viên theo email Google xác minh; thành viên chỉ vào được tổ chức đã mời.
5. Đăng xuất/hết hạn session được xử lý đúng.
6. Tạo xe và xem lại sau refresh.
7. Tạo một khoản chi phí và thấy Dashboard tăng chính xác.
8. Chỉnh sửa/hủy khoản chi phí và KPI/báo cáo được tính lại đúng.
9. Tạo một bản ghi nhiên liệu kèm giao dịch tài chính và **không cộng trùng**.
10. Bộ lọc biểu đồ, KPI và bảng báo cáo trả số liệu nhất quán.
11. Xuất Excel/PDF khớp số liệu bộ lọc và quyền truy cập.
12. Báo cáo chi phí/km hiển thị “Chưa đủ dữ liệu” khi mẫu số không hợp lệ.
13. Mức tiêu hao nhiên liệu chỉ tính khi có đủ dữ liệu/phương pháp hợp lệ.
14. Nhắc hạn bảo dưỡng/giấy tờ chạy đúng và không gửi thông báo trùng.
15. Upload ảnh hóa đơn bằng camera trên điện thoại; tải/xem ảnh theo quyền.
16. Không có lỗi responsive trên màn hình rộng 360px hoặc 390px.
17. Chức năng chính đạt hành vi mong đợi trên desktop, Android và iPhone.
18. `build`, `typecheck`, `lint` và các tests được cấu hình phải thành công.
19. Docker Compose triển khai được app/database và dữ liệu được lưu qua restart.
20. README, `.env.example`, Prisma migrations, `GOOGLE_LOGIN_SETUP.md` và hướng dẫn backup có đầy đủ.

---

## 19. HƯỚNG DẪN THỰC HIỆN DÀNH CHO AI CODING AGENT

Bạn cần **thực sự xây dựng ứng dụng**, không dừng lại ở việc mô tả, tư vấn hay thiết kế UI.

### Cách làm việc

**Bước 1 — Khảo sát:** Đọc repository, package manager, database, component system, quy ước sẵn có. Không giả định repository trống nếu chưa kiểm tra.

**Bước 2 — Lập kế hoạch:** Tạo file `IMPLEMENTATION_PLAN.md` gồm kiến trúc, ERD/schema, các mô-đun, thứ tự công việc, trạng thái và tiêu chí nghiệm thu.

**Bước 3 — Thiết lập nền tảng:** Dựng database, auth Google, RBAC, multi-tenancy, layout responsive. Đảm bảo auth end-to-end trước khi mở rộng nghiệp vụ.

**Bước 4 — Xây dựng module:** Hoàn thành cả backend, frontend, validation, kiểm thử, xử lý lỗi và kết nối database cho từng module. Không tạo các nút không có hành vi.

**Bước 5 — Dashboard/báo cáo:** Tạo hàm tổng hợp thống nhất, không hardcode KPI, không cộng trùng chi phí, kiểm tra các trường hợp thiếu dữ liệu.

**Bước 6 — Mobile/PWA:** Kiểm thử màn hình nhỏ, điều hướng một tay, nhập nhanh, camera upload, tương thích dark mode.

**Bước 7 — Kiểm thử:** Chạy build/lint/typecheck/test ở các mốc chính, xử lý lỗi trước khi chuyển mô-đun. Kiểm thử auth, dữ liệu tài chính, tenancy và export.

**Bước 8 — Triển khai:** Docker Compose, `.env.example`, README, hướng dẫn cấu hình Google OAuth, HTTPS, backup và khôi phục.

### Quy tắc tác nghiệp

- Không xóa hoặc làm hỏng dữ liệu hiện có.
- Không cam kết hoàn thành chức năng nếu chưa kiểm tra được.
- Không dùng dữ liệu giả trong dashboard production.
- Không đưa client secret vào code client, tài liệu public hoặc Git.
- Không bỏ qua các trường hợp lỗi, empty state và quyền truy cập.
- Nếu cần dịch vụ bên ngoài (Google OAuth), hãy tạo đầy đủ cấu hình và tài liệu; chỉ rõ các bước cấu hình credentials/domain mà chủ hệ thống phải thực hiện.
- Khi môi trường cho phép chỉnh sửa/chạy mã, **chủ động lập kế hoạch rồi triển khai thực tế theo các giai đoạn**, không dừng ở lời khuyên.
- Sau mỗi giai đoạn cập nhật `IMPLEMENTATION_PLAN.md`: hoàn thành, đang thực hiện, chưa thực hiện, các vấn đề còn lại.

### Các đầu ra bắt buộc

- Source code có cấu trúc rõ ràng.
- Prisma schema + migrations.
- Google Sign-in hoạt động với credentials hợp lệ.
- UI tiếng Việt trên desktop và mobile.
- CRUD xe/chi phí/nhiên liệu/vận hành.
- Dashboard KPI và biểu đồ có dữ liệu thật.
- Báo cáo tổng hợp, chi tiết và exports.
- Docker/Compose deployment.
- `.env.example`, `README.md`, `IMPLEMENTATION_PLAN.md`.
- `docs/GOOGLE_LOGIN_SETUP.md`.
- Bộ kiểm thử cho nghiệp vụ trọng yếu.

---

## 20. KẾT QUẢ CUỐI CÙNG MONG MUỐN

Ứng dụng **Web Quản lý xe và chi phí** hoàn chỉnh, cho phép người dùng **đăng nhập bằng Google (Gmail)**, quản lý nhiều xe, ghi nhận nhanh mọi khoản chi phí, theo dõi nhiên liệu/vận hành/bảo dưỡng, xem **Dashboard với biểu đồ trực quan**, báo cáo **tổng hợp và chi tiết**, xuất Excel/PDF, sử dụng mượt mà trên di động và triển khai được trên VPS bằng Docker.

**Hãy bắt đầu ngay bằng cách kiểm tra repository, đề xuất kiến trúc, tạo `IMPLEMENTATION_PLAN.md`, sau đó ưu tiên thực hiện giai đoạn nền tảng + đăng nhập Google trước các phân hệ khác.**
