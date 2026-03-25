# App Ảnh Native UI Design

**Mục tiêu**

Làm lại UI của app `Ảnh` theo cảm giác gần với app Ảnh trên iPhone: gọn, ít viền, ít chữ, ưu tiên nội dung ảnh, thao tác rõ nhưng không nặng giao diện.

**Phạm vi**

- Chỉ áp dụng cho app `Ảnh`
- Giữ mô hình dữ liệu Supabase hiện tại
- Không mở rộng nghiệp vụ ngoài những gì đã có: upload, album, xóa, chia sẻ, di chuyển ảnh

**Hướng thiết kế**

- `Tất cả ảnh` là màn thư viện chính, dùng lưới 3 cột trên điện thoại
- `Album` là tab quản lý album, cũng dùng lưới 3 cột gọn
- Chạm ảnh mở viewer gần full-screen nền tối
- Chạm album đi vào trang album riêng thay vì chỉ quản lý tại chỗ
- Các thao tác chính dùng icon/SVG kèm nhãn ngắn để giảm chiều cao UI

**Cấu trúc màn hình**

1. `Tất cả ảnh`
- Header một dòng: tiêu đề + nút upload tròn
- Lưới ảnh 3 cột, khoảng cách nhỏ, không bọc card dày
- Ảnh là trọng tâm, không hiển thị metadata trong grid

2. `Viewer ảnh`
- Nền đen toàn màn hình
- Ảnh căn giữa, tối đa theo chiều cao màn hình
- Thanh thao tác dưới gồm: `Chia sẻ`, `Di chuyển`, `Xóa`
- Có thể giữ nút lấy đường dẫn nhưng hạ thành hành động phụ

3. `Album`
- Header gọn với nút tạo album
- Lưới 3 cột
- Mỗi album có thumbnail bìa, tên, số lượng ảnh
- Menu `...` cho đổi tên/xóa album

4. `Trang album riêng`
- Header: back, tên album, `...`
- Lưới ảnh 3 cột giống `Tất cả ảnh`
- Từ đây vẫn mở viewer chung

**Kiến trúc UI**

- Tách viewer ảnh thành component riêng để dùng lại ở `Tất cả ảnh` và trang album
- Tách grid album thành component riêng để cùng một visual language
- Bổ sung route trang album chi tiết, tận dụng API/hook hiện có theo `folderId`

**Dữ liệu và luồng**

- `Tất cả ảnh` lấy `usePhotoItems(null)`
- `Album` lấy `usePhotoFolders()` và đếm số ảnh theo `folder_id`
- Trang album riêng lấy `usePhotoItems(folderId)`
- `Di chuyển` cập nhật cache ảnh để grid và album count phản ánh nhanh hơn

**Xử lý lỗi**

- Upload lỗi: hiển thị feedback ngắn, không phá layout
- Xóa ảnh lỗi: giữ viewer mở và báo lỗi
- Xóa album: xác nhận trước; ảnh trong album chuyển về `không album`

**Kiểm thử cần có**

- Build TypeScript/Next thành công
- Mở `Tất cả ảnh`, `Album`, viewer, trang album riêng không lỗi
- Upload, move, delete, rename album hoạt động
- Grid 3 cột hiển thị ổn trên mobile width
