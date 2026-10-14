# ERD và quy tắc số liệu (P0-05, P0-07)

```mermaid
erDiagram
  User ||--o{ Account : has
  User ||--o{ Session : authenticates
  User ||--o{ OrganizationMember : joins
  Organization ||--o{ OrganizationMember : has
  Organization ||--o{ Vehicle : owns
  Organization ||--o{ ExpenseCategory : defines
  Vehicle ||--o{ Expense : charged
  ExpenseCategory ||--o{ Expense : classifies
  Expense ||--o| FuelLog : references
  Expense ||--o| MaintenanceRecord : references
  Expense ||--o{ Attachment : proves
  User ||--o{ AuditLog : creates
```

Chính sách dữ liệu: unique `(provider,providerAccountId)`, `(organizationId,userId)`, `(organizationId,normalizedPlate)`, `(organizationId,idempotencyKey)`. Index expense theo `(organizationId,occurredAt,status)`, `(organizationId,vehicleId,occurredAt)`, `(organizationId,categoryId,occurredAt)`. DB tiền `DECIMAL(18,0)`; thời điểm `TIMESTAMPTZ`; `createdAt` tách ngày phát sinh. Guard và database transaction kiểm xe và expense cùng tenant.

`SUM(expenses.amount WHERE status=POSTED)` là tổng duy nhất trong tổ chức và khoảng UTC tương ứng `Asia/Ho_Chi_Minh`; VOID không tính. Lít và kWh khác đơn vị; 0/thiếu km hoặc chu kỳ không hợp lệ hiển thị “Chưa đủ dữ liệu”. GĐ3–GĐ4 bổ sung schema và migration riêng theo thứ tự kế hoạch.
