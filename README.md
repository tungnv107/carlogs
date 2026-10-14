# CarLog – Quản lý xe và chi phí

Ứng dụng Next.js 15 để đăng nhập Google, quản lý phương tiện, nhiên liệu/sạc, hành trình, bảo dưỡng/giấy tờ, nhắc hạn và chi phí theo tổ chức; giao diện tiếng Việt, tiền VND, ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`. Có Dashboard, 6 biểu đồ, bộ lọc báo cáo, Excel/CSV và bản in để lưu PDF. Đây là bản **MVP đang phát triển**, chưa nghiệm thu end-to-end với Google OAuth hoặc PostgreSQL thực.

## Chạy cục bộ (Windows PowerShell)

Yêu cầu: Node.js 22+, npm, Docker Desktop với Linux engine đang chạy, Google Cloud OAuth **Web application**.

```powershell
Copy-Item .env.example .env
# Chỉnh DATABASE_URL và cấu hình Google trong .env trước khi chạy các bước bên dưới
npm run db:up
npm ci
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
npm run dev
```

Sửa `.env` bằng Google client ID/secret của bạn và `AUTH_SECRET` đủ mạnh **trước** khi đăng nhập. `npm run db:up` đọc `DATABASE_URL` và khởi động **chỉ** dịch vụ PostgreSQL local qua Docker Compose, dùng đúng user/password/database/port trong URL (ví dụ `127.0.0.1:55432`). Script không in mật khẩu hay sửa file `.env`; Docker Compose lưu biến môi trường vào cấu hình container. Yêu cầu Docker Desktop đã chạy **Linux engine**. Nếu muốn kiểm tra cấu hình mà chưa chạy Docker, dùng `npm run db:up -- --check`. Mở `http://localhost:3000/login`. Google Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`. Hướng dẫn chi tiết: [docs/GOOGLE_LOGIN_SETUP.md](docs/GOOGLE_LOGIN_SETUP.md).

Nếu `/login` báo `AdapterError`, `SessionTokenError` hay `Can't reach database server`, kiểm tra Docker Desktop, chạy `npm run db:up`, sau đó `npx prisma migrate status`. Lưu ý volume PostgreSQL **đã khởi tạo trước đó** vẫn giữ user/password trong database; đổi `DATABASE_URL` hoặc Compose **không tự đổi mật khẩu** trong volume cũ. Nếu gặp lỗi xác thực `P1000`, phải khớp lại mật khẩu của database hiện có trước khi chạy migration. **Không dùng `docker compose down -v`** để sửa lỗi đăng nhập vì lệnh đó xóa dữ liệu trong volume.

**Lỗi thiếu `.next/routes-manifest.json` khi chạy `next dev`:** Dev server hiện dùng thư mục `.next-dev` riêng, còn production build dùng `.next`; có thể ghi đè lựa chọn bằng `NEXT_BUILD_DIR` khi cần. Lệnh `npm run dev` tự nạp compatibility shim cho thao tác `realpath` trên Windows/OneDrive (không thay đổi hành vi trên Linux/macOS). Dừng server cũ (`Ctrl+C`) rồi chạy lại `npm run dev`; không cần xóa `.next` hay đụng đến database. Tránh chạy nhiều lệnh `next dev` cùng một thư mục output, đặc biệt trên ổ đang được OneDrive đồng bộ. Nếu Next vẫn báo lỗi ghi file hoặc socket trên ổ đồng bộ, nên chạy mã nguồn trên thư mục local không được đồng bộ và chỉ đồng bộ/backup tài liệu cần thiết.

Biểu tượng `N` của Next.js trong chế độ phát triển đã được tắt bằng `devIndicators: false` trong `next.config.mjs`. Các thư mục `.next*` là sản phẩm build/cache, không phải mã nguồn và đã nằm trong `.gitignore`. Các thư mục kiểm thử cũ có thể xóa sau khi dừng mọi tiến trình Next.js; giữ lại output đang được server sử dụng. Tránh đồng bộ những thư mục build này lên OneDrive.

Sau lần Google login đầu tiên, tạo workspace cá nhân ở `/onboarding`. Danh mục chi phí khởi tạo trong transaction tạo workspace; `npm run db:seed` hiện không chèn dữ liệu demo.

## Chạy kiểm tra

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

Build yêu cầu biến môi trường trong `.env`. Trên một số máy Windows có thư mục được đồng bộ OneDrive, Prisma CLI có thể cần `NODE_OPTIONS=--require=./scripts/windows-realpath-compat.cjs` và đường dẫn tuyệt đối tới schema/query engines. Xem [docs/TEST_PLAN.md](docs/TEST_PLAN.md); kiểm thử unit/build **không thay thế** nghiệm thu PostgreSQL/OAuth.
Nếu Next.js build báo `EPERM` khi tạo thư mục bên trong `.next` của ổ đồng bộ, có thể thử build lại; để tránh xung đột tệp lâu dài nên chạy build trên ổ/thư mục mã nguồn không được đồng bộ thời gian thực.

## Tài liệu sử dụng và triển khai

- [Hướng dẫn sử dụng](docs/USER_GUIDE.md) – thao tác quản lý xe, chi phí, nhiên liệu, lịch trình, nhắc hạn và báo cáo.
- [Triển khai VPS/HTTPS](docs/DEPLOYMENT.md) – Compose, secret, Google callback, reverse proxy và giám sát.
- [Sao lưu và phục hồi](docs/BACKUP_RESTORE.md) – database, file riêng tư, checksum và quy trình diễn tập.
- [Kế hoạch kiểm thử](docs/TEST_PLAN.md) và [ghi chú phát hành](docs/RELEASE_NOTES.md).

**Production Compose:** `.env` phải có `DATABASE_URL` trỏ tới hostname `db` trong mạng Compose và password đã URL-encode; cấu hình local `@localhost` chỉ dành cho `compose.dev.yaml`. Docker Compose production giữ DB và file riêng tư trên volumes. Trước khi nhập dữ liệu thật phải cấu hình HTTPS, lịch backup và **thực hành restore**; xem tài liệu triển khai.

## Vận hành dữ liệu

- Phương tiện và chi phí được phân phạm vi theo tổ chức, vai trò và (đối với tài xế) xe được giao.
- Chi phí `POSTED` là nguồn tổng hợp duy nhất; `VOID` giữ lịch sử, không cộng vào số liệu. Lưu trữ xe không xóa giao dịch.
- Ảnh hóa đơn/ảnh xe nằm tại thư mục private `UPLOAD_DIR`, qua API có kiểm tra quyền. **Không** đặt thư mục này dưới `public/`; sao lưu cả database và thư mục uploads.
- `compose.dev.yaml` chỉ dành cho môi trường phát triển. Đã có hướng dẫn vận hành, backup/restore và cấu hình reverse proxy; **chưa chạy diễn tập/kiểm chứng trên VPS thực**.

Tiến độ task và blocker: [IMPLEMENTATION_PLAN_Vehicle_Expense_Manager.md](IMPLEMENTATION_PLAN_Vehicle_Expense_Manager.md).
