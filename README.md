# WWM Overlay - MIDI Music Player (Vùng Đất Chill Rebuild)

Trình phát nhạc MIDI tự động cho game **Where Winds Meet**, được **Vùng Đất Chill** rebuild và tùy chỉnh lại từ phiên bản gốc.  
Ứng dụng tự động gửi phím để chơi nhạc trong minigame nhạc cụ của game.

> **Lưu ý:** Chế độ 36 phím hiện đang **thử nghiệm và chưa ổn định**. Để ổn định nhất, hãy sử dụng **chế độ 21 phím (mặc định)**.

---

## Giới thiệu

Công cụ này cho phép bạn **tự động chơi nhạc trong minigame nhạc cụ của Where Winds Meet** bằng file MIDI.

Chỉ cần:
- Bỏ file `.mid` vào thư mục `album`
- Mở game
- Nhấn Play trong app

Tool sẽ **tự động mô phỏng phím đàn theo thời gian thực**.

---

## Tính năng chính

- Giao diện tối, mượt mà
- Kéo thả file MIDI nhanh chóng
- Tự động cập nhật phiên bản mới
- Phát nhạc khi không cần focus game (local mode)
- Hỗ trợ cloud gaming
- 7 chế độ xử lý nốt nhạc
- Chuyển đổi 21 / 36 phím
- Điều chỉnh tốc độ phát & octave
- Hệ thống hàng chờ & playlist
- Danh sách yêu thích
- Phím tắt toàn cục
- Mini mode
- Hỗ trợ thư viện MIDI lớn
- Band Mode (thử nghiệm)

---

## Hướng dẫn cài đặt

1. Tải bản mới nhất từ mục **Releases**
2. Giải nén ra bất kỳ thư mục nào
3. Tạo thư mục `album`
4. Bỏ các file `.mid` vào thư mục `album`
5. Chuột phải `wwm-overlay.exe` → **Run as Administrator**

---

## Phím tắt

F9: Play / Pause  
F10: Bài trước  
F11: Bài sau  
F12: Dừng  
Insert: Mini mode  

---

## Sự cố thường gặp

- Không nhận phím → Chạy quyền Admin
- Nhạc sai tông → Đổi chế độ nốt hoặc octave
- Không thấy bài → Kiểm tra thư mục `album`

---

## Build từ mã nguồn

npm install  
npm run tauri-dev  
npm run tauri-build  

File `.exe` nằm trong `src-tauri/target/release/`

---

## Công nghệ

- Tauri
- Svelte
- Rust

Dự án được **Vùng Đất Chill rebuild và tùy chỉnh** từ mã nguồn gốc.
