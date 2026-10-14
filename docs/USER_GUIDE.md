# Hướng dẫn sử dụng — Vehicle & Expense Manager

> Giao diện tiếng Việt, đơn vị VND và ngày giờ Việt Nam. Đây là phiên bản MVP đang kiểm thử; kết quả thực tế cần xác nhận sau khi cấu hình Google OAuth và PostgreSQL.

## 1. Vào hệ thống và chọn không gian

Mở URL ứng dụng, chọn **Tiếp tục với Google**. Lần đầu đăng nhập, tạo không gian làm việc ở trang onboarding; sau đó vào **Tổng quan**. Chủ sở hữu/quản trị viên có thể vào **Tài khoản → Quản lý thành viên** để mời người dùng theo email. Nếu tham gia nhiều tổ chức, chọn không gian ở thanh đầu trang và nhấn **Đổi**. Mỗi không gian có danh sách xe, chi phí, thành viên riêng. Vai trò quyết định quyền quản trị, ghi sổ và xuất dữ liệu.

## 2. Tạo và quản lý phương tiện

Chọn **Phương tiện → Thêm phương tiện**. Nhập biển số, tên, loại phương tiện, nhiên liệu và km hiện tại (cùng các thông tin khác nếu có). Biển số được chuẩn hóa, hạn chế trùng trong tổ chức. Mở từng xe để xem chi tiết, cập nhật thông tin và hồ sơ liên quan. Khi cần giảm/sửa giá trị đồng hồ km, dùng **điều chỉnh odometer** có lý do để lưu dấu vết, tránh sửa giảm âm thầm.

## 3. Ghi và tra cứu chi phí

Chọn **Thêm chi phí** trên thanh điều hướng hoặc Dashboard, chọn xe, danh mục, ngày, số tiền, nội dung và chứng từ (nếu có). Kiểm tra kết quả sau khi lưu; nếu form báo lỗi, sửa các trường được thông báo rồi gửi lại. Ảnh hóa đơn có thể chọn từ thiết bị hoặc camera và chỉ được truy cập qua API có phân quyền.

Chọn **Lịch sử** để lọc/xem chi tiết và điều chỉnh/hủy khoản chi khi vai trò cho phép. Chỉ khoản chi **POSTED** được cộng vào báo cáo; giao dịch **VOID** vẫn giữ lịch sử để đối chiếu. Tránh tạo thêm khoản chi thủ công cho một lần đổ xăng/bảo dưỡng đã ghi ở phân hệ tương ứng: hệ thống tự tạo bản ghi sổ chi phí liên kết.

## 4. Nhiên liệu, sạc điện và hành trình

Ở **Nhiên liệu / sạc**, chọn xe, loại nhiên liệu/năng lượng, lượng (L hoặc kWh), đơn giá, số km, ngày và thông tin đầy bình nếu có. Tiền được tính từ lượng × đơn giá, tạo **một** khoản chi liên kết trong sổ. Lít và kWh được thống kê riêng; tiêu hao L/100 km hoặc kWh/100 km chỉ hiện khi có mốc dữ liệu phù hợp.

Ở **Hành trình**, nhập xe, thời gian, km đầu/cuối, mục đích và người lái. Phần mềm kiểm tra km hợp lệ và hành trình chồng lấn. Chi phí/km trong báo cáo lấy quãng đường từ hành trình đủ điều kiện; nếu chưa nhập quãng đường, kết quả hiển thị **Chưa đủ dữ liệu**.

## 5. Bảo dưỡng, giấy tờ và nhắc hạn

Vào **Bảo dưỡng** để thêm lần bảo dưỡng/sửa chữa (có hoặc không phát sinh phí), lập lịch theo ngày hoặc số km, bổ sung giấy tờ và file riêng tư. Giao dịch bảo dưỡng có phí được liên kết về sổ chi phí. Chọn **Trung tâm nhắc hạn** (hoặc liên kết cảnh báo trên Dashboard) để xem sắp đến hạn, đến hạn, quá hạn và các mục đã xử lý. Dịch vụ scheduler trên máy chủ sẽ cập nhật nhắc hạn khi website không mở; nếu scheduler chưa cấu hình, thông báo có thể chưa tự cập nhật.

## 6. Dashboard, báo cáo và xuất file

Dashboard hiển thị chi phí tháng, tổng chi phí, số xe, cảnh báo và các giao dịch gần đây. Trang **Báo cáo** cho lọc theo từ ngày/đến ngày, phương tiện và danh mục; gồm KPI, 6 biểu đồ và danh sách chi tiết theo trang. Mặc định chỉ tổng hợp giao dịch POSTED và phân tách theo quyền truy cập.

Các vai trò được phép xuất có thể bấm **Tải Excel (.xlsx)**, **Tải CSV** hoặc **In / Lưu PDF**. Ở trang in, chọn **In / Lưu PDF** rồi chọn đích **Save as PDF / Lưu dưới dạng PDF** của trình duyệt; giấy A4 ngang. Excel/CSV giới hạn **10.000** giao dịch/lần; trang in liệt kê tối đa **1.000** giao dịch gần nhất nhưng số tổng vẫn tính toàn bộ. Hãy thu hẹp kỳ lọc nếu cần đầy đủ từng dòng trên bản in.

## 7. Sử dụng trên điện thoại và khi mất mạng

Giao diện có thanh điều hướng phía dưới và hỗ trợ cài dạng PWA trên trình duyệt tương thích. Nếu mất mạng, **không coi khoản chi là đã lưu** khi chưa nhận phản hồi thành công từ máy chủ. Ứng dụng chưa hỗ trợ tự đồng bộ chi phí nhập offline. Khi kết nối lại, kiểm tra **Lịch sử** trước khi gửi thêm để tránh nhập trùng.

## 8. Quyền và an toàn thông tin

Không chia sẻ file URL/tài khoản, không đưa ảnh hóa đơn lên thư mục public; đăng xuất khi dùng chung thiết bị. Chủ sở hữu và quản trị viên chịu trách nhiệm phân quyền thành viên. Nếu người dùng không thấy xe/chứng từ/báo cáo, hãy kiểm tra tổ chức đang chọn và quyền được cấp.
