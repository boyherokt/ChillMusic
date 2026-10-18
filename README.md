# 🎵 Chill Music – Trình phát nhạc MIDI cho Game (Where Winds Meet & Yanshan)

Trình phát nhạc MIDI thông minh dạng cửa sổ phủ (Overlay) hiện đại phong cách Spotify, tự động mô phỏng bấm phím nhạc cụ trong game (**Where Winds Meet / Yên Vân Thập Lục Thanh - yysls**).

> 💖 **Lời cảm ơn & Nguồn gốc dự án:**  
> Dự án được làm lại (rework & tiếp tục phát triển) từ dự án mã nguồn mở ban đầu của tác giả **[YueLyn (SnowiyQ)](https://github.com/SnowiyQ/Where-Winds-Meet-Midi-Player)**. Xin gửi lời cảm ơn chân thành và sâu sắc nhất đến tác giả **YueLyn** vì đã tạo nên một nền móng tuyệt vời!  
> Vì dự án gốc hiện đã dừng phát triển tính năng mới, **Hưng (Vùng Đất Chill)** quyết định tiếp tục duy trì, làm mới giao diện, tối ưu hoá logic hàng chờ/ngẫu nhiên chuẩn Spotify và phát triển thêm các tính năng mới phục vụ cộng đồng.  
> Mọi ý kiến đóng góp, báo lỗi và Pull Request từ các bạn luôn luôn được chào đón!

---

<p align="center">
  <img width="780" alt="Chill Music Screenshot" src="https://github.com/user-attachments/assets/8977b742-7f7d-47d9-b78f-d36ed677e3c5" />
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Phiên_bản-1.2.1-1db954" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Nền_tảng-Windows-blue" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Công_nghệ-Rust%20%7C%20Tauri%20v2%20%7C%20Svelte%205-orange" /></a>
  <a href="https://discord.com/invite/c9a4paH47J"><img src="https://img.shields.io/badge/Cộng_đồng-Vùng_Đất_Chill-5865F2?logo=discord" /></a>
</p>

---

## 🎬 Video Demo tính năng

* **Demo phát nhạc tự động:**  
  https://github.com/user-attachments/assets/4d25e203-0e4f-4b0f-8dc4-e855ce5e6647  

* **Demo đồng bộ & điều khiển:**  
  https://github.com/user-attachments/assets/5223ff30-a859-4433-84c0-bfb3d8a8ed46  

### 🟢 Chế độ Thu nhỏ (Mini Floating Icon)
Bấm phím **`Insert`** để thu nhỏ trình phát thành icon tròn mờ lơ lửng trên màn hình game. Icon phát sáng viền xanh lá khi nhạc đang chơi.

<p align="center">
  <img width="64" height="89" alt="Mini mode icon" src="https://github.com/user-attachments/assets/f0de318f-6a1a-4e92-93c8-ba73b42d4d13" />
</p>

---

## ✨ Điểm nổi bật & Cập nhật mới (v1.2.1)

* 🎨 **Giao diện Kính mờ Đen tuyền (Obsidian Glass):** Thiết kế tối giản, độ trong suốt tinh tế, không chói mắt, sắc nét và hiện đại.
* 🎧 **Hàng chờ & Phát ngẫu nhiên chuẩn Spotify:**
  * **Hàng chờ ưu tiên (User Queue):** Tách biệt với danh sách đang nghe, phát hết bài đợi sẽ tự động quay lại ngữ cảnh trước đó.
  * **Xáo trộn bài không lặp lại (Fisher-Yates Shuffle):** Tất cả các bài trong danh sách chỉ phát đúng 1 lần duy nhất trong một chu kỳ xáo trộn.
  * Tự động chọn 1 bài ngẫu nhiên để phát ngay khi bấm "Phát ngẫu nhiên" ở Thư viện, Playlist hay Yêu thích.
* 🎮 **Hỗ trợ nhận diện cửa sổ game:** Nhận diện tự động Where Winds Meet và Yên Vân Thập Lục Thanh (`yysls.exe`).
* 🎹 **Chế độ phím đa dạng:** Hỗ trợ 21 phím tự nhiên hoặc 36 phím bán âm (kèm tổ hợp Shift/Ctrl).
* ⚡ **Bộ phím tắt toàn cục (Global Hotkeys):** Dừng/Phát (F9), Lùi bài (F10), Chuyển bài (F11), Dừng hẳn (F12) ngay cả khi đang tập trung chơi trong game.
* 🌐 **Chơi nhóm (Band Mode) & Chia sẻ P2P:** Kết nối nhiều người chơi cùng lúc để hòa tấu các bài MIDI nhiều bè nhạc cụ.
* 🇻🇳 **Ngôn ngữ:** Hỗ trợ đầy đủ Tiếng Việt cùng 5 ngôn ngữ khác (Anh, Trung, Nhật, Hàn, Thái).

---

## 🚀 Hướng dẫn sử dụng nhanh

### 1. Chuẩn bị file nhạc MIDI
Tạo hoặc mở thư mục `album` nằm cạnh file thực thi và chép các file `.mid` của bạn vào đó:
```text
Chill-Music/
├── chill-music.exe
├── locales/          <- Thư mục chứa các file ngôn ngữ giao diện
├── album/            <- Đặt các bài nhạc .mid của bạn tại đây!
│   ├── BaiHat1.mid
│   └── BaiHat2.mid
```

### 2. Khởi chạy & Phát nhạc
1. Mở game và vào chế độ chơi nhạc cụ trong game.
2. Nhấp chuột phải vào `chill-music.exe` chọn **Run as administrator** *(Bắt buộc quyền Admin để ứng dụng có thể giả lập thao tác gõ phím vào cửa sổ game)*.
3. Chọn bài hát trong Thư viện và bấm **Play**!

---

## ⌨️ Phím tắt mặc định

| Phím | Chức năng |
| :--- | :--- |
| **`F9`** | Phát / Tạm dừng (Play / Pause) |
| **`F10`** | Lùi về bài trước (hoặc tua về 0:00 nếu đã chơi >3s) |
| **`F11`** | Chuyển sang bài kế tiếp (Next) |
| **`F12`** | Dừng phát nhạc (Stop) |
| **`Insert`** | Bật / tắt chế độ thu nhỏ (Mini Floating Icon) |
| **`[` / `]`** | Chuyển đổi nhanh chế độ tính nốt nhạc |

*(Bạn có thể tùy chỉnh lại phím tắt trong mục **Settings → Keybindings**).*

---

## 🛠 Tự build từ mã nguồn (Building from Source)

Dự án sử dụng **Tauri v2 + Rust + Bun + Svelte 5**:

1. **Yêu cầu cài đặt:**
   * [Bun](https://bun.sh)
   * [Rust & Cargo](https://rustup.rs) (phiên bản ổn định mới nhất)
   * C++ Build Tools (Visual Studio 2022 Community hoặc Build Tools có chọn C++)

2. **Chạy chế độ lập trình (Dev Mode):**
   Chạy file **`dev.bat`** (script tự động xin quyền Admin, thiết lập môi trường C++ và khởi chạy).

3. **Đóng gói phát hành (Build Release):**
   Chạy file **`build.bat`** hoặc dòng lệnh:
   ```bash
   bun install
   bun run tauri build
   ```
   File thực thi `.exe` sau khi build xong sẽ nằm tại:
   `src-tauri/target/release/chill-music.exe`

---

## 🤝 Tham gia & Đóng góp

Dự án phi lợi nhuận phục vụ cộng đồng yêu âm nhạc trong game:
* **Báo lỗi & Đóng góp ý tưởng:** Vui lòng tạo [Issue](https://github.com/boyherokt/ChillMusic/issues) hoặc gửi Pull Request.
* **Giao lưu kết bạn:** Tham gia cộng đồng **[Discord – Vùng Đất Chill](https://discord.com/invite/c9a4paH47J)**.
* **Tác giả phát triển hiện tại:** **Hưng (Vùng Đất Chill)**.
* **Tác giả gốc:** **YueLyn (SnowiyQ)**.
