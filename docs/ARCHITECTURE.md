# Quyết định kiến trúc (P0-04, P0-08)

- **ADR-001:** Modular monolith Next.js App Router + TypeScript + Tailwind; Server Actions/Route Handlers → service → Prisma → PostgreSQL. Không dùng dữ liệu demo làm dashboard.
- **ADR-002:** Auth.js v5 Google OIDC scope `openid email profile`, PrismaAdapter, database session HttpOnly. Google identity là unique `(provider, providerAccountId)`, không gộp chỉ theo email. Guard chặn user DISABLED.
- **ADR-003:** User mới tạo workspace cá nhân riêng trong transaction và là `OWNER` **của workspace**, không là admin toàn hệ thống. Không auto-join theo email domain. Luồng mời thành viên dùng token ngẫu nhiên, chỉ lưu SHA-256 token trong DB; chỉ tài khoản Google có email đã xác thực khớp lời mời mới chấp nhận được. Membership ở DB, không lấy quyền từ Google. Cần nghiệm thu bằng PostgreSQL và tài khoản OAuth thật.
- **ADR-004:** `expenses` là sổ cái duy nhất; `amount Decimal(18,0)` làm tròn VND trước khi lưu, chỉ `POSTED` được tổng hợp; `VOID` có audit. Idempotency key unique theo organization. Fuel/maintenance tham chiếu `expenseId UNIQUE` và không cộng thêm.
- **ADR-005:** Thời điểm lưu UTC; ngày/chu kỳ kinh doanh theo `Asia/Ho_Chi_Minh`, kỳ `[startInclusive,endExclusive)`. Chi phí/km chỉ khi có quãng đường đáng tin; L/100km chỉ với chu kỳ đầy bình hợp lệ; không cộng L và kWh.
- **ADR-006:** Attachments ở `UPLOAD_DIR` ngoài `public/`, tên UUID, kiểm MIME/size và API tải kiểm tra quyền. Backup đồng thời DB + tệp.
- **ADR-007:** Scheduler độc lập Docker, notification dedupe/retry; triển khai sau GĐ2.

**Luồng tin cậy:** UI → Server Action/Route → `requireSession` → `requireOrganizationAccess` → Zod → Service → transaction Prisma. Mọi `vehicleId`, `expenseId`, `organizationId` từ client đều phải xét lại trong query có tenant scope. Vai trò `OWNER/ADMIN/MANAGER/ACCOUNTANT/DRIVER/VIEWER`; quyền của lái xe giới hạn phương tiện được gán khi triển khai assignment.
