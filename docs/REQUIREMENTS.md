# Phạm vi và use cases (P0-02, P0-03)

| Module | MVP | Hậu MVP |
|---|---|---|
| OAuth | Google OIDC, đăng xuất, user/profile, workspace, role guard | Quản trị session nâng cao |
| Tổ chức | Cá nhân riêng, RBAC, lời mời bằng token và email Google đã xác thực (đã code; chờ test E2E) | Phê duyệt nhiều cấp |
| Xe | CRUD, lưu trữ, ảnh, trạng thái, tìm kiếm | GPS/OBD |
| Chi phí | Danh mục, VND, CRUD/VOID, chống nhập trùng, hóa đơn | OCR, ngân sách |
| Nhiên liệu | Lít/kWh, một expense tham chiếu | Nhập tự động |
| Hành trình | Odometer, thời gian và km hợp lệ | GPS |
| Bảo dưỡng | Việc làm, hạn giấy tờ, thông báo | Push/email |
| Báo cáo | KPI/biểu đồ DB, lọc, Excel/PDF | Dự báo |
| Mobile | Bottom nav, PWA, camera | Offline queue |

## Các luồng nghiệp vụ cần nghiệm thu

1. **UC-AUTH:** Chọn Google → OIDC callback → link theo `providerAccountId` → onboarding cá nhân → dashboard; logout/expire trở lại login.
2. **UC-VEHICLE:** Owner tạo xe với biển số duy nhất trong tổ chức, xem/sửa/lưu trữ; xe có chi phí không xóa cứng.
3. **UC-EXPENSE:** Chọn xe, ngày, danh mục, tiền nguyên VND, ghi chú/ảnh → server kiểm tra quyền → transaction có idempotency key → lịch sử và KPI đọc `POSTED` → sửa/VOID có audit.
4. **UC-FUEL:** Lít/kWh + giá Decimal → tạo fuel log và một expense trong cùng transaction, không cộng hai lần.
5. **UC-TRIP:** Km cuối ≥ km đầu, thời gian và quãng đường hợp lệ; báo lỗi hành trình chồng lấn.
6. **UC-MAINTENANCE:** Nhập hạng mục, ngày/km/garage, expense liên kết duy nhất, giấy tờ và cảnh báo hạn.
7. **UC-REPORT:** Kỳ/xe/danh mục lọc tại server, KPI/chart/bảng/export dùng cùng `expenses POSTED`; thiếu km trả N/A.
8. **UC-EXPORT:** Server xác minh quyền tổ chức và bộ lọc, xuất tiếng Việt với số liệu khớp sổ cái.

Không thực hiện Gmail API, Google Drive API, OCR, GPS thời gian thực, đồng bộ ngân hàng, native app, offline queue hoặc microservices ở MVP.
