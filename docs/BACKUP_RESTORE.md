# Sao lưu và phục hồi dữ liệu

Ứng dụng dùng PostgreSQL và volume `/app/uploads` chứa ảnh xe, hóa đơn, giấy tờ. Phải sao lưu **cả hai**; chỉ có database sẽ tạo tham chiếu chứng từ hỏng, chỉ có uploads sẽ mất metadata/quyền.

## Sao lưu bằng Docker Compose trên máy chủ Linux

Đóng băng tác vụ ghi mới hoặc chọn maintenance window. Sau đó chạy ở thư mục chứa `compose.yaml`, `.env`:

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh /var/backups/vehicle-manager
```

Script tạo thư mục theo UTC, gồm `database.dump` (`pg_dump -Fc`), `uploads.tar` và `SHA256SUMS`. Không ghi đè bản cũ; lỗi một bước sẽ không công bố thư mục backup hoàn chỉnh. Dùng `sha256sum -c SHA256SUMS` để kiểm tra checksum. PostgreSQL snapshot nhất quán **trong DB**, nhưng file upload và DB **không có snapshot nguyên tử chung**: bảo đảm không ghi thêm chi phí/tệp trong lúc sao lưu. Script cần cả dịch vụ `db`, `web` đang chạy; tải backup về storage ngoài VPS, mã hóa, giới hạn quyền truy cập và đặt retention phù hợp (ví dụ ngày/tuần/tháng theo chính sách đơn vị). Không đặt backup dưới thư mục được web public.

Ví dụ lịch chạy sau khi đã triển khai cửa sổ maintenance window, thực thi dưới user được phép gọi Docker:

```cron
30 1 * * * cd /srv/vehicle-manager && /usr/bin/bash scripts/backup.sh /var/backups/vehicle-manager >> /var/log/vehicle-backup.log 2>&1
```

**Cron không tự làm ứng dụng chỉ đọc**. Muốn bảo đảm tính nhất quán uploads/DB, phải chủ động ngừng nhận request ghi hoặc dùng snapshot hạ tầng phù hợp. Giám sát lệnh cron thất bại và dung lượng, truyền backup ra nơi khác; không xem lịch cron là bằng chứng backup thành công.

## Quy trình thử phục hồi trên môi trường cách ly

Chỉ dùng VPS/container/volumes **staging độc lập**. Không chạy các lệnh dưới đây nhắm vào cơ sở dữ liệu production vì `pg_restore --clean` thay thế dữ liệu đang có.

1. Tạo staging Compose project độc lập, URL staging và **volume mới**; kiểm tra tên project bằng `docker compose -p vehicle-restore-test ps`. Khởi động DB/staging, bảo đảm phiên bản PostgreSQL tương thích; sao chép **đủ** backup (`database.dump`, `uploads.tar`, checksum).
2. Trong thư mục backup chạy `sha256sum -c SHA256SUMS`, kiểm tra cả hai file hợp lệ. Ngừng `web` và `reminders` của staging trước khi restore.
3. Với project staging đúng, ở thư mục chứa Compose và `.env` **staging**:

```bash
docker compose -p vehicle-restore-test stop web reminders
docker compose -p vehicle-restore-test exec -T db sh -c 'exec pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-acl' < /path/to/database.dump
docker compose -p vehicle-restore-test run -T --rm --no-deps --entrypoint tar web -C /app/uploads -xf - < /path/to/uploads.tar
docker compose -p vehicle-restore-test up -d web reminders
```

`docker compose run` tạo container tạm gắn cùng volume uploads, không cần bật web khi giải nén. Đảm bảo user trong image có quyền ghi volume; nếu file cũ còn sót, làm sạch volume staging trước restore. Tuyệt đối không nhầm project staging với production.

4. Kiểm tra `SELECT` số bản ghi xe, expense POSTED/VOID, mối liên kết `fuel_logs`/bảo dưỡng; đăng nhập tài khoản staging hợp lệ, mở hóa đơn cũ qua API có phân quyền, kiểm tra dashboard/export tổng tiền; chạy một vòng job reminders. Ghi biên bản restore: backup ID, thời điểm, phiên bản, checksum, người thao tác, sai khác.

**Mục tiêu vận hành:** khôi phục được dữ liệu và file đúng quyền, không có orphan references, kiểm tra độc lập với production. Chưa có diễn tập được chạy trên PostgreSQL thật tại thời điểm viết hướng dẫn; task P7-09 và AT-22 chỉ được đánh dấu sau khi thực hành thành công.
