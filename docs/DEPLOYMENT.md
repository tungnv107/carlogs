# Triển khai production (VPS Linux, Docker Compose, HTTPS)

> Trạng thái: hướng dẫn và cấu hình đã chuẩn bị; **chưa nghiệm thu triển khai thực tế** vì môi trường hiện tại chưa có Docker daemon/PostgreSQL/OAuth hoạt động. Chỉ dùng dữ liệu thực sau khi hoàn thành checklist AT-01–AT-22.

## 1. Chuẩn bị máy chủ

- VPS Linux x86_64 hoặc ARM64 đủ RAM/disk cho Next.js + PostgreSQL; Docker Engine và Docker Compose plugin; domain DNS A/AAAA trỏ về VPS.
- Mở firewall 80/443; **không mở PostgreSQL 5432 hoặc cổng app 3000 ra Internet**. Compose chỉ publish app trên `127.0.0.1:3000`.
- Đồng bộ thời gian bằng NTP/chrony; chuẩn bị dung lượng riêng cho PostgreSQL, chứng từ và bản sao lưu.
- Cài Nginx trên host làm reverse proxy và Certbot (hoặc dùng reverse proxy TLS tương đương).

## 2. Secret và `.env`

Tại thư mục ứng dụng trên VPS:

```bash
cp .env.example .env
chmod 600 .env
openssl rand -hex 32    # ví dụ giá trị DB_PASSWORD, tự chép vào file
openssl rand -base64 48 # ví dụ AUTH_SECRET và REMINDER_JOB_SECRET (hai giá trị độc lập)
```

Cập nhật `.env`: `DB_USER`, `DB_NAME`, `DB_PASSWORD` mạnh; `DATABASE_URL` dùng **hostname `db`**, cùng user/password/database; `AUTH_URL=https://xe.example.vn`; `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `REMINDER_JOB_SECRET`. `UPLOAD_DIR` trong Compose đã ghi đè thành `/app/uploads` trên volume riêng. `DATABASE_URL` production, ví dụ:

```dotenv
DB_USER="vehicle"
DB_NAME="vehicle_expenses"
DB_PASSWORD="generated-hex-password"
DATABASE_URL="postgresql://vehicle:generated-hex-password@db:5432/vehicle_expenses?schema=public"
AUTH_URL="https://xe.example.vn"
```

**Lưu ý quan trọng:** nếu mật khẩu DB có ký tự như `@`, `#`, `%`, `/`, `:` thì phải **percent-encode** phần password trong `DATABASE_URL`; `DB_PASSWORD` giữ nguyên bản gốc. Không dùng URL `@localhost` khi web chạy trong container. Không commit `.env`, upload, backup. `.env.example` mặc định cho **local dev** nên phải sửa URL và password trước khi chạy production.

Google Cloud OAuth Web Client: thêm authorized origin `https://xe.example.vn` và redirect URI chính xác `https://xe.example.vn/api/auth/callback/google`. Xem [GOOGLE_LOGIN_SETUP.md](GOOGLE_LOGIN_SETUP.md).

## 3. Khởi động và kiểm tra

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 migrate web reminders
curl -fsS http://127.0.0.1:3000/api/health
```

Compose có dịch vụ `db` (PostgreSQL, volume `postgres_data`), `migrate` (`prisma migrate deploy`), `web` (Next.js, volume `uploads_data`) và `reminders` (gọi job mỗi giờ). Web chỉ chạy sau khi migrate thành công. Trạng thái `/api/health` = `ok` cần DB kết nối; lỗi 503 nghĩa là chưa sẵn sàng. Kiểm tra không có `ERROR`, xác minh Google login thực tế với tài khoản test và chuyển tổ chức theo quyền.

## 4. Reverse proxy HTTPS

Mẫu Nginx sau giả định hostname `xe.example.vn` và TLS được cấp bởi Certbot:

```nginx
server {
    listen 80;
    server_name xe.example.vn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
        client_max_body_size 6m;
    }
}
```

Sau khi kiểm tra `nginx -t`, reload Nginx và cấp chứng chỉ TLS bằng Certbot: `sudo certbot --nginx -d xe.example.vn`; đảm bảo redirect HTTP → HTTPS. Hãy thay domain thật trong cả Nginx, `.env` và Google Cloud. `AUTH_TRUST_HOST=true` trong Compose chỉ dùng khi proxy là thành phần tin cậy và cổng Next.js không public.

## 5. Vận hành, giám sát và cập nhật

- Health: `curl -fsS https://xe.example.vn/api/health`; giám sát mã lỗi, disk/volume, CPU/RAM, PostgreSQL connections, ứng dụng và reminders qua `docker compose logs -f --tail=100 web reminders`.
- Scheduler: job `/api/jobs/reminders` dùng `REMINDER_JOB_SECRET` riêng, không public secret này. Thử tạo lịch hết hạn và kiểm tra notification được tạo ngay cả khi người dùng không mở website.
- Backups: thiết lập cron cho `scripts/backup.sh` trong cửa sổ ít ghi, đồng bộ backup ra vị trí mã hóa ngoài VPS; xem [BACKUP_RESTORE.md](BACKUP_RESTORE.md). Phải kiểm tra restore trên môi trường cách ly trước production.
- Cập nhật: tạo bản backup → kiểm tra migration mới → triển khai image/code đã review → `docker compose up -d --build` → kiểm tra health và nghiệp vụ. Migration `deploy` **không tự rollback**; nếu lỗi dữ liệu cần restore một bản backup đã thử nghiệm trên staging.
- Tránh đưa credentials vào command line/history, log hoặc URL truy vấn. Giới hạn quyền đọc `.env`; giám sát log không chứa OAuth token hay nội dung chứng từ.

## 6. Kiểm tra bắt buộc trước GO

Thực hiện toàn bộ AT-01–AT-22 trong [IMPLEMENTATION_PLAN](../IMPLEMENTATION_PLAN_Vehicle_Expense_Manager.md): Google đăng nhập lại, người dùng chéo tổ chức, CRUD, double-submit, POSTED/VOID, upload private, tính nhiên liệu/km, job nhắc hạn, đối chiếu Dashboard/Excel/PDF, 360–430px, tắt mạng, restart và thử restore. **Chưa có bằng chứng thực hiện trên VPS nên hiện tại NO-GO.**
