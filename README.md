# Clipboard to PNG Saver

Ứng dụng Windows hiện đại giúp lưu hình ảnh từ clipboard thành file PNG/JPG chỉ với một thao tác.

## Tính năng chính
- **Global Hotkey**: Nhấn `Ctrl + V` hoặc `Ctrl + Shift + V` để lưu ngay lập tức bất kể ứng dụng đang mở là gì. (Lưu ý: `Ctrl + V` sẽ ghi đè chức năng paste của hệ thống nếu được bật).
- **Auto-Save**: Tự động lưu mọi hình ảnh được copy vào clipboard (có thể bật/tắt).

- **Manual Capture**: Nút nhấn trong UI để lưu thủ công.
- **Premium UI**: Giao diện Glassmorphism hiện đại, hỗ trợ Dark mode.
- **System Tray**: Chạy nền gọn gàng trong khay hệ thống.
- **Timestamp Filename**: Tự động đặt tên theo thời gian thực (ví dụ: `clip_2026-02-27T12-30-00.png`).
- **Alpha Channel**: Giữ nguyên độ trong suốt của ảnh.

## Cách sử dụng
1. Để ứng dụng chạy nền.
2. Copy một hình ảnh (Screenshot, Save Image, v.v.).
3. Nhấn `Ctrl + Shift + V` hoặc bật **Auto-Save**.
4. Hình ảnh sẽ được lưu vào thư mục `Pictures/ClipboardPNG` (có thể thay đổi trong Settings).

## Phát triển
```bash
npm install
npm run dev
npm run build:win
```
