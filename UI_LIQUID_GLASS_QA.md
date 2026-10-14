# CarLog — Premium Liquid Glass QA

Ngày: 14/10/2026. Tài liệu này chỉ mô tả kiểm chứng đã thực sự chạy. Trạng thái “Chưa” không có nghĩa đã phát hiện lỗi.

## Functional checks

| Check | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- |
| TypeScript (`npm run typecheck`) | **Đạt** | Chạy sau chỉnh sửa UI cuối; không có lỗi TS |
| ESLint (`npm run lint`) | **Đạt** | Chạy sau chỉnh sửa UI cuối |
| Test (`npm test`) | **Đạt — 49/49** | Bộ test hiện có; có cảnh báo `MODULE_TYPELESS_PACKAGE_JSON` từ Node, không ảnh hưởng kết quả |
| Production build | **Đạt** | Next.js 15.5.27, 23 trang static prerender; dùng `NODE_OPTIONS=--require=./scripts/windows-realpath-compat.cjs`, `NEXT_BUILD_SKIP_STANDALONE=1`, `NEXT_BUILD_DIR=.next-liquidglass-complete-20261014`. Prisma client đã cài; `npm run build` mặc định có thể lỗi tải Prisma binary nếu DNS chặn `binaries.prisma.sh` |
| Chrome viewport / screenshots `/login` | **Đạt — 10 cấu hình** | Chrome DevTools Protocol; không tràn ngang; screenshot lưu dưới `tmp-ui-review/liquid-glass/` |
| Theme toggle & localStorage | **Đạt — `/login`** | Đổi light/dark qua nút và kiểm tra khóa `xelog-theme` được giữ |
| Google login & signout | Chưa xác minh live | Giữ nguyên actions/auth; cần tài khoản Google thực |
| Expense create/edit, upload & report export | Chưa E2E live | Guard, form names, actions, API giữ nguyên |
| Role scopes/organization switch | Chưa E2E live | UI nút Theo role, query guard giữ nguyên |

## Visual matrix

| Route group | 360×800 | 390×844 | 1366×768 | Dark mode | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `/login` | **Đạt** | **Đạt** | **Đạt** | **Đạt** | 10 screenshot; cả light và dark được kiểm tra ở 390px và 1366px |
| `/dashboard` | Chưa | Chưa | Chưa | Chưa | Cần đăng nhập |
| `/vehicles`, `/vehicles/[id]` | Chưa | Chưa | Chưa | Chưa | Cần xe thật |
| `/expenses`, `/expenses/new`, `/expenses/[id]` | Chưa | Chưa | Chưa | Chưa | Cần dữ liệu và quyền |
| `/fuel`, `/fuel/new` | Chưa | Chưa | Chưa | Chưa | Cần dữ liệu |
| `/trips`, `/trips/new` | Chưa | Chưa | Chưa | Chưa | Cần dữ liệu |
| `/maintenance`, `/notifications` | Chưa | Chưa | Chưa | Chưa | Cần dữ liệu |
| `/reports`, `/reports/print` | Chưa | Chưa | Chưa | Chưa | Cần dữ liệu |
| `/account`, `/settings/members` | Chưa | Chưa | Chưa | Chưa | Cần session/role |

### Chrome screenshot matrix — `/login`

| Screenshot | Viewport | Theme | Kết quả |
| --- | --- | --- | --- |
| `mobile-360-light.png` | 360×800 | Light | Không tràn ngang |
| `mobile-375-light.png` | 375×812 | Light | Không tràn ngang |
| `mobile-390-light.png` | 390×844 | Light | Không tràn ngang |
| `mobile-390-dark.png` | 390×844 | Dark | Không tràn ngang |
| `mobile-430-dark.png` | 430×932 | Dark | Không tràn ngang |
| `tablet-768-light.png` | 768×1024 | Light | Không tràn ngang |
| `tablet-1024-dark.png` | 1024×768 | Dark | Không tràn ngang |
| `desktop-1366-light.png` | 1366×768 | Light | Không tràn ngang |
| `desktop-1366-dark.png` | 1366×768 | Dark | Không tràn ngang |
| `desktop-1920-light.png` | 1920×1080 | Light | Không tràn ngang |

Script tái chạy: `tmp-ui-review/liquid-glass/capture-cdp.cjs` với biến môi trường `CARLOG_QA_PORT` trỏ tới server QA. Hai vòng xem ảnh/sửa layout đã tập trung vào: khoảng trống phía trên và logo ở màn hình ≤375px; vị trí theme toggle ở tablet 1024px; chiều cao card và khoảng cách hero/footer. Kiểm tra DOM bounding-box tại 1024px vẫn đánh dấu `themeToggleOverlapsCard`, nhưng ở cấu hình này toggle được đặt **có chủ đích bên trong** card đăng nhập; ảnh xác nhận không che nội dung.

### Phạm vi chưa xác minh

- Không có bộ screenshot baseline trước redesign đủ tin cậy để đo so sánh trước/sau toàn bộ các route.
- Các trang đòi hỏi tài khoản (`/dashboard`, `/vehicles`, `/expenses`, `/fuel`, `/trips`, `/maintenance`, `/reports`, `/account` và trang quản trị) **chưa được browser QA sau đăng nhập**. Đặc biệt floating glass bottom navigation cần được kiểm tra bằng phiên đăng nhập thực và các role khác nhau.
- Google OAuth, lưu/sửa/xóa dữ liệu thật, upload chứng từ, export, đổi workspace/phân quyền và luồng keyboard ảo/touch trên iOS/Android thực **chưa E2E**. Việc giữ nguyên API/actions/Prisma không thay thế E2E.
- Chưa đo tương phản WCAG tự động và các trạng thái focus/dialog/tràn chữ khi dữ liệu dài trên mọi route.
- Kiểm tra HTTP smoke localhost bổ sung ngày 14/10/2026 bị môi trường từ chối mở socket `127.0.0.1:3335` ("An attempt was made to access a socket in a way forbidden by its access permissions"); không suy ra đây là lỗi ứng dụng. Kết quả browser đã ghi ở trên là từ vòng chạy trước đó.
