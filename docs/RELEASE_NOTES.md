# Ghi chú phát hành

## 0.1.0-dev — 13/10/2026 (chưa nghiệm thu production)

- Nền tảng Next.js 15, Auth.js Google OAuth, Prisma/PostgreSQL, tổ chức và phân quyền; onboarding và lời mời.
- Quản lý xe, sổ chi phí POSTED/VOID, audit, chứng từ private; nhiên liệu/sạc (không cộng trùng), hành trình, điều chỉnh km, bảo dưỡng, giấy tờ, nhắc hạn định kỳ.
- Dashboard và báo cáo lọc theo kỳ/xe/danh mục, 6 biểu đồ, giao dịch chi tiết theo trang, xuất Excel/CSV và trang in PDF bằng trình duyệt.
- UI mobile, điều hướng dưới, PWA, thông báo kết nối; cấu hình Docker Compose gồm DB, migrate, web và reminders, health endpoint, CI.
- Bổ sung `scripts/backup.sh` và hướng dẫn VPS/HTTPS, backup/restore, sử dụng. Sửa Compose để dùng trực tiếp `DATABASE_URL` cấu hình an toàn khi mật khẩu chứa ký tự URL đặc biệt; chỉnh giao diện in ẩn topbar và phân trang giấy.
- Gia cố idempotency khi hai yêu cầu lưu nhiên liệu/bảo dưỡng cạnh tranh: so khớp cả người ghi, xe, thời gian, số tiền, lượng, đơn giá, trạng thái; cùng payload được nhận lại, payload khác bị từ chối.
- Bổ sung các phép kiểm tra Decimal cho xăng và điện, L/kWh, full-to-full, hành trình, phân quyền và xuất file; 27 unit tests đạt. Cho phép tắt riêng standalone output khi kiểm tra build cục bộ trên thư mục Windows được đồng bộ (`NEXT_BUILD_SKIP_STANDALONE=1`); Docker production vẫn mặc định standalone.
- Thống nhất kỳ hành trình giữa trang lịch sử và báo cáo: chỉ dùng chuyến nằm hoàn toàn trong kỳ, không suy diễn km cho chuyến vượt ranh giới; giới hạn giá trị trang phân trang không hợp lệ.
- Nhắc hạn giấy tờ tiến triển UPCOMING → DUE → OVERDUE, giữ nguyên cảnh báo đã xử lý; giấy tờ được gia hạn có khóa cảnh báo mới.
- Thêm bảng so sánh theo phương tiện ngay tại trang báo cáo: tổng chi phí POSTED, nhiên liệu/sạc, quãng đường, chi phí/km, kỳ trước cùng số ngày và tỷ lệ biến động. Decimal cho VND, N/A khi thiếu km hoặc cơ sở tính tỷ lệ.
- Kiểm tra lại **31/31 unit tests**, lint, typecheck, Prisma schema validate và Next production build non-standalone trên Windows (exit code 0). Các bổ sung này chưa được nghiệm thu tích hợp PostgreSQL.

**Kiểm chứng:** unit tests, lint, typecheck và build được theo dõi tại [kế hoạch](../IMPLEMENTATION_PLAN_Vehicle_Expense_Manager.md). Các bài test có DB thật, OAuth thật, kiểm thử trên điện thoại và thử restore chưa có bằng chứng hoàn tất. **Chưa công bố production-ready**.

- Bổ sung phân trang về trang cuối hợp lệ sau khi lọc ở trang nhiên liệu, hành trình, bảo dưỡng và chi tiết báo cáo; thứ tự bản ghi ổn định.
- Hoàn thành lịch bảo dưỡng bằng việc chọn bản ghi công việc cụ thể; backend kiểm tra ID, cùng tổ chức/xe và thời điểm, ghi `maintenanceRecordId` trong audit. Tiêu đề Excel hiển thị biển số/tên xe, tên danh mục thay vì ID.
- Sau sửa đổi: **33/33 unit tests**, lint, typecheck, Prisma validate đạt; build mới nhất compile và tạo trang thành công nhưng chưa xác nhận được exit code bước tracing do công cụ theo dõi tiến trình bị chặn.
