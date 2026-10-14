# CarLog — UI/UX Redesign Audit & Checklist

Ngày cập nhật: **13/10/2026** · Định hướng: **Premium automotive-finance SaaS**, mobile first.

## 1. Audit trước khi sửa

Đã đọc prompt yêu cầu, kiểm kê Next.js App Router, `app`, `components`, `modules`, `auth.ts`, Prisma và các API. Đợt audit ban đầu dựa trên source/layout và styles cũ: giao diện nhiều thẻ thông tin phẳng, thiếu nhịp điệu thị giác; sidebar và trạng thái active chưa rõ; màn hình điện thoại còn nhiều khối form/bộ lọc dàn hàng; CTA nhập chi phí và số tiền chưa nổi bật; mẫu biểu và trạng thái dữ liệu chưa thống nhất. Tất cả route đều dùng server data và quyền truy cập nên phải giữ nguyên kết nối nguồn dữ liệu.

**Bằng chứng trực quan:** chưa có screenshot BEFORE đủ 390px/1440px của các route yêu cầu. Không sử dụng nhận định trên source như bằng chứng thử nghiệm trên thiết bị thật.

## 2. Hệ thống và luồng chính

| Ưu tiên | Màn hình/nhóm | Kiểm kê vấn đề và quyết định xử lý | Mã nguồn/UI | Nghiệm thu browser thật |
|---|---|---|:---:|:---:|
| 1 | Design System | Tokens màu navy/blue/teal, phông Việt, bậc chữ, card, nút, form, badge, focus | [x] | [ ] |
| 2 | App Shell + Sidebar/Topbar | Nhóm điều hướng rõ, active state, avatar, tổ chức, thông báo, đăng xuất | [x] | [ ] |
| 3 | Dashboard | KPI nguồn thật, thứ bậc 1 hero + chỉ số hỗ trợ, biểu đồ, lọc kỳ/xe, nhắc hạn, giao dịch | [x] | [ ] |
| 4 | Bottom Navigation | Bottom nav 5 mục trên điện thoại, safe-area, CTA nhập chi phí | [x] | [ ] |
| 5 | `/expenses/new` | Số tiền nổi bật, chọn xe có tìm kiếm, gợi ý xe, chứng từ, lưu liên tiếp, trạng thái lỗi | [x] | [ ] |
| 6 | `/vehicles`, `/vehicles/new`, `/vehicles/[id]` | Card danh sách, ảnh thật nếu có, chi phí và km, hồ sơ xe/chi tiết, form | [x] | [ ] |
| 7 | `/expenses`, `/expenses/[id]` | Giao dịch theo danh sách/card; lọc thật, xem/sửa/hủy theo quyền | [x] | [ ] |
| 8 | `/reports`, `/reports/print` | KPI, biểu đồ, so sánh xe, phân trang, xuất Excel/CSV và in PDF | [x] | [ ] |
| 9 | `/fuel`, `/fuel/new` | Danh sách và nhập nhiên liệu/sạc, đơn vị riêng, hành động rõ | [x] | [ ] |
| 10 | `/trips`, `/trips/new` | Hành trình, lịch sử, hiệu chỉnh odometer, lọc ngày/xe | [x] | [ ] |
| 11 | `/maintenance`, `/maintenance/schedules/[id]/complete` | Lịch, bản ghi, giấy tờ, nhắc hạn, chọn công việc hoàn thành | [x] | [ ] |
| 12 | `/login`, `/onboarding`, `/invite/[token]` | Nhận diện thương hiệu, Google OAuth thật, trạng thái onboarding/lời mời | [x] | [ ] |
| 13 | `/account`, `/notifications`, `/settings/members` | Tài khoản, trung tâm nhắc hạn, thành viên và phân quyền | [x] | [ ] |
| 14 | Hệ thống | Skeleton loading, lỗi tải trang có retry, 404 có CTA | [x] | [ ] |

`[x]` tại cột mã nguồn nghĩa là **đã chỉnh UI trong repo**, không phải đã kiểm thử E2E. Mọi truy vấn số liệu phải đi qua scope tổ chức/role. Không thêm nút giả hoặc dữ liệu dashboard mẫu.

## 3. Component và kiến trúc hoàn thiện

- [x] Tokens + global primitives trong `app/globals.css` và `tailwind.config.ts`.
- [x] `AppShell`, `ActiveSidebar`, `MobileNavigation` với điểm truy cập chức năng hiện hữu.
- [x] `PageHeader`, `StatCard`, `FilterDrawer` và các biểu đồ có dữ liệu thật.
- [x] Form tạo/sửa xe, chi phí, xăng/sạc, hành trình và bảo dưỡng giữ nguyên server actions.
- [x] Responsive card/list trên các trang lịch sử; lọc GET mở thành native bottom sheet dưới 768px.
- [x] Dashboard lọc tháng/quý/năm/tùy chỉnh và xe, giữ URL query; bảo vệ phạm vi xe khi lấy lịch sử và nhắc hạn.
- [x] `loading.tsx`, `error.tsx`, `not-found.tsx` ở mức tuyến/layout.
- [x] PWA shell: manifest nhận diện CarLog, service worker chỉ cache tài nguyên tĩnh, trang hướng dẫn ngoại tuyến; không cache API, HTML xác thực hoặc giao dịch; có 3 unit tests cho ranh giới cache.
- [x] Mục Tài khoản hiển thị form đổi không gian làm việc khi người dùng tham gia nhiều tổ chức, kể cả trên mobile; dùng server action có kiểm tra membership đang hoạt động.
- [x] Trường nhập VND nhóm hàng nghìn khi gõ, giữ vị trí con trỏ và gửi chuỗi số nguyên chính xác; kiểm tra giới hạn 15 chữ số bằng unit test.
- [x] Chứng từ: chọn ảnh/PDF từ thư viện, mở camera sau điện thoại, xem ảnh trước khi gửi, xóa ảnh đã chọn và kiểm tra MIME/5 MB ở client; server vẫn kiểm tra độc lập.
- [x] Biểu đồ donut/bar/line, thứ tự danh mục/xe và tỷ trọng báo cáo dùng phép chia/so sánh dựa trên `BigInt` cho VND nguyên lớn; có unit test giới hạn số an toàn của JavaScript.
- [x] Form chi phí và nhiên liệu chặn gửi khi `navigator.onLine` báo ngoại tuyến, giữ giá trị để người dùng kết nối rồi gửi lại; không báo đã lưu khi chưa có phản hồi máy chủ.
- [x] Form bảo dưỡng/sửa chữa dùng chung trường VND có phân nhóm hàng nghìn (mặc định 0 ₫, gửi số nguyên chính xác); cả ba form bảo dưỡng, lịch nhắc và giấy tờ chặn gửi khi trình duyệt báo ngoại tuyến và giữ nội dung đã nhập.
- [x] Trang login sửa giới hạn bề ngang cho grid và nội dung ở màn nhỏ (`w-full`, `minmax(0,1fr)`, `min-w-0`); dashboard dùng `FilterDrawer` cho bộ lọc kỳ và phương tiện trên di động, giữ GET query thật.
- [x] Dùng chung `useOnlineSubmission` và `OfflineNotice` cho biểu mẫu xe, hành trình, điều chỉnh km, lời mời thành viên, tạo/sửa chi phí và bảo dưỡng; khi trình duyệt báo ngoại tuyến, chặn gửi và giữ nội dung đã nhập (cần kiểm tra mạng gián đoạn trong E2E).
- [x] Trang sửa chi phí sử dụng `ExpenseEditForm`, trường nhập VND có dấu phân nhóm hàng nghìn, nút lưu báo trạng thái đang gửi và giữ nguyên `updateExpense` server action/authorization.
- [ ] Kiểm tra trực quan liên tục trên browser đã đăng nhập cho **mọi** route.
- [ ] Kiểm tra cảm ứng/khả dụng trên iOS Safari và Android Chrome thật.
- [ ] E2E Google OAuth → xe → chi phí → dashboard → báo cáo → xuất file trên database thật.

## 4. Danh sách kiểm tra chất lượng

- [ ] Screenshot **BEFORE** 390/1440px các màn hình chủ chốt (chưa có bản baseline; không dựng ảnh giả).
- [ ] Screenshot **AFTER** dashboard, xe, chi tiết xe, thêm chi phí, lịch sử, báo cáo, login ở 390/1440px.
- [ ] Viewport 360/390/430/768/1024/1440/1920px không tràn ngang/đè CTA.
- [ ] Tab/focus, Escape/đóng bottom sheet, trình đọc màn hình, số tiền lớn, tên xe dài.
- [ ] Chạy kiểm thử tương tác trên PostgreSQL có dữ liệu, Google OAuth, camera upload và tất cả vai trò.
- [ ] Đo Web Vitals và tải trang trên mạng di động thật.
- [x] Không thay đổi Prisma schema hoặc OAuth provider khi redesign.
- [x] Lưu trạng thái bộ lọc qua GET; kiểm tra phía server trước khi truy vấn.

Lệnh nghiệm thu tự động: `npm run lint`, `npm run typecheck`, `npm test`, `npx prisma validate`, `npm run build`. Kết quả từng lần chạy được ghi ở nhật ký `IMPLEMENTATION_PLAN_Vehicle_Expense_Manager.md`; check browser/E2E chỉ đánh dấu sau khi có bằng chứng.

**Kết quả kiểm tra vòng trước (13/10/2026):** lint, typecheck đạt; `npm test` đạt **42/42** (thêm unit test số VND nhập và tỷ trọng báo cáo); `npx prisma validate` và `node --check public/sw.js` đạt. `npx next build` non-standalone, với compatibility shim và `NEXT_BUILD_DIR=.next-verification-1013`, **đạt exit code 0** sau sửa biểu đồ, camera và VND; build lại sau khi bổ sung chặn form lúc ngoại tuyến gặp lỗi hệ thống Windows `EPERM` khi tạo `server/app/api/documents`. Thử thư mục đầu ra mới `.next-verification-1013-final` cũng gặp `EPERM` tại `types/app/api`. Vì vậy khi đó **chưa xác nhận production build cuối cùng sau toàn bộ thay đổi đạt**, dù lint/typecheck/unit đều đạt. Lần đó chưa có browser screenshot; localhost, Docker/PostgreSQL và Google OAuth chưa đáp ứng để chạy E2E.

**Kết quả gần nhất, 13/10/2026:** bổ sung bản xem trước chi phí nhiên liệu tính chính xác bằng BigInt theo đơn vị phần nghìn, khớp phép tính Decimal và làm tròn VND `ROUND_HALF_UP` phía server; giới hạn tổng hợp lệ từ **1 đến 999.999.999.999.999 ₫**, hiển thị cảnh báo khi tổng không hợp lệ và chặn submit để tránh tạo giao dịch chắc chắn bị từ chối. Giới hạn quantity/đơn giá trên input trùng schema; số tiền dự kiến có `aria-live`. `npm test` **44/44**, lint, typecheck, `prisma validate`, cú pháp SW đều **đạt**. Production build Next non-standalone với `NEXT_BUILD_DIR=.next-fuel-final-1013` và `NODE_OPTIONS=--require=./scripts/windows-realpath-compat.cjs` **đạt exit code 0**, biên dịch đủ các route. `npm run build` mặc định (có Prisma generate + standalone) và browser/E2E/thiết bị thật chưa xác minh; các checkbox này vẫn `[ ]`.

**Kiểm tra tiếp ngày 13/10/2026:** sửa tràn ngang có thể xảy ra ở login mobile, thay bộ lọc dashboard bằng `FilterDrawer` responsive, đồng bộ nhập tiền VND và cảnh báo ngoại tuyến cho các form bảo dưỡng/lịch/giấy tờ. Chạy sau sửa: `npm run lint`, `npm run typecheck`, `npm test` (**44/44**), `npx prisma validate`, `node --check public/sw.js` đều đạt. `npx next build` **đạt exit code 0**, tạo 23 trang static, với `NEXT_BUILD_SKIP_STANDALONE=1`, `NEXT_BUILD_DIR=.next-xelog-1013-final-v2`, `NODE_OPTIONS=--require=./scripts/windows-realpath-compat.cjs`; phải tạo sẵn cây thư mục build theo route vì Next trên ổ đồng bộ OneDrive nhiều lần gặp `EPERM mkdir` dù tạo thủ công được. Đây là bản build không-standalone, chưa xác nhận `npm run build` mặc định.

**Kiểm tra ảnh và giới hạn:** đã có ảnh chẩn đoán login trước/sau trong `tmp-ui-review`, nhưng các ảnh sau lần chụp trước cho cùng kích thước mặc định của Chrome, nên **không thể dùng để nghiệm thu 360/390/430/1440px**. Sau lần sửa mới nhất, máy chủ `next start` báo Ready, nhưng `Invoke-WebRequest` tới `127.0.0.1:3110` bị hệ thống từ chối socket (`An attempt was made to access a socket in a way forbidden by its access permissions`). Thử lại luồng Chrome headless với quyền nâng cao cũng trả về `Local login route unavailable`, **không tạo screenshot hợp lệ**. Chưa thử giao diện có đăng nhập, Google OAuth, PostgreSQL, camera trên thiết bị và phân quyền E2E; giữ nguyên các ô `[ ]` tương ứng.

**Kiểm tra mới nhất (13/10/2026):** sau khi đồng bộ cảnh báo ngoại tuyến cho các biểu mẫu còn lại và thay form sửa chi phí bằng trường nhập VND có định dạng, `npm run lint`, `npm run typecheck`, `npm test` (**44/44**), `npx prisma validate` đều đạt. `npx next build` non-standalone với `NEXT_BUILD_SKIP_STANDALONE=1`, `NEXT_BUILD_DIR=.next-xelog-1013-final-v3` và shim `scripts/windows-realpath-compat.cjs` **đạt exit code 0**, sinh đủ **23/23 static pages**. Việc tạo sẵn cây thư mục output vẫn cần thiết trên ổ đồng bộ OneDrive để tránh `EPERM mkdir`; đã bỏ include types tạm do Next tự thêm vào `tsconfig.json`. Lần chạy build được xác nhận này không bao gồm bước `prisma generate`/standalone của lệnh `npm run build` mặc định. Browser/E2E/viewport trên máy thật vẫn chưa nghiệm thu.

**Thử `npm run build` mặc định:** bước `prisma generate` đầu tiên không tải được engine checksum và binary từ `binaries.prisma.sh` (`getaddrinfo ENOTFOUND`). Khi trỏ tới engine cục bộ đã cài trong `node_modules/@prisma/engines`, lệnh vẫn dừng tại `EPERM: operation not permitted, rename ...node_modules/.prisma/client/query_engine-windows.dll.node.tmp... -> query_engine-windows.dll.node`. Đây là lỗi tạo client Prisma trên ổ đồng bộ/đang khóa file; lần thử này **không đạt**, chưa kiểm chứng standalone. Không sửa schema, không sử dụng lệnh xóa cưỡng bức DLL hoặc dữ liệu người dùng.

**Khắc phục lỗi development manifest:** ghi nhận `.next/routes-manifest.json` không tồn tại tại thời điểm kiểm tra dù thư mục `.next` chứa các manifest khác. Khởi động thử `next dev` với `NEXT_BUILD_DIR=.next-xelog-dev-troubleshoot` tạo được `routes-manifest.json` và báo Ready. Cấu hình `next.config.mjs` chọn `.next-dev` mặc định trong development để tránh xung đột với `.next` của production build; `tsconfig.json` giữ đường dẫn types ổn định. Cần xác minh HTTP/browser riêng vì thử truy cập `127.0.0.1:3111` từ môi trường công cụ bị Windows từ chối socket.

## 5. Rủi ro và việc phải hoàn tất trước production

**Sự cố runtime 13/10/2026:** log người dùng xác nhận Next dev đã compile `/`, `/dashboard`, `/login`, nhưng Auth.js `PrismaAdapter` không tìm được PostgreSQL tại `127.0.0.1:55432` (`SessionTokenError`/`AdapterError`). Đã bổ sung `npm run db:up` để đọc đúng host port/user/password/database từ `.env` và truyền cho `compose.dev.yaml`; giữ nguyên session database, Google OAuth và toàn bộ volume. **49/49 unit tests**, lint, typecheck, Compose `config -q`, `db:up -- --check` đạt. Docker Desktop đã được gọi mở, nhưng Linux engine/WSL2 chưa xác nhận chạy và `npm run db:up` báo thiếu Docker API trước khi Docker Desktop khởi động; chưa thể xác nhận Prisma migration, đăng nhập thực tế hoặc E2E. Checklist browser và DB vẫn `[ ]`.

- [x] Đồng bộ cấu hình khởi chạy PostgreSQL local với `DATABASE_URL` và kiểm tra parser bằng unit tests.
- [ ] Docker Linux engine hoạt động; xác nhận PostgreSQL có thể nhận kết nối ở port cấu hình.
- [ ] `npx prisma migrate status`, login Google và session qua PostgreSQL thật.

1. PostgreSQL/Docker và Google credentials thật chưa sẵn cho test flow đa người dùng/đa tổ chức; bắt buộc kiểm tra phân quyền, upload, xuất file và làm mới KPI bằng dữ liệu thật.
2. Cần chụp viewport sau đăng nhập và kiểm tra mobile keyboard/safe-area trên thiết bị, điều chỉnh các màn hình phát sinh clipping.
3. Trước khi phát hành, hoàn tất checklist AT-01–AT-22, backup/restore và cấu hình OAuth/HTTPS trong kế hoạch triển khai.

