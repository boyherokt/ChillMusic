# Chill Music – Trình phát nhạc MIDI cho Game (Where Winds Meet & Yanshan)

Trình phát nhạc MIDI dạng cửa sổ phủ (Overlay) hiện đại phong cách Spotify, tự động mô phỏng phím bấm nhạc cụ trong game (**Where Winds Meet / Yên Vân Thập Lục Thanh - yysls**).

> **Nguồn gốc dự án & Lời cảm ơn:**  
> Dự án được làm lại (rework) và tiếp tục phát triển dựa trên dự án mã nguồn mở của tác giả **[YueLyn (SnowiyQ)](https://github.com/SnowiyQ/Where-Winds-Meet-Midi-Player)**. Xin chân thành cảm ơn tác giả **YueLyn** vì nền tảng tuyệt vời ban đầu.  
> Do dự án gốc hiện đã ngừng phát triển tính năng mới, **Hưng (Vùng Đất Chill)** tiếp tục duy trì, bảo trì lỗi, nâng cấp logic phát nhạc Spotify và phát triển thêm các tính năng phục vụ cộng đồng.  
> Dự án luôn hoan nghênh mọi ý kiến đóng góp, báo lỗi và Pull Request.

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

## Video Demo

* **Demo phát nhạc tự động:**  
  https://github.com/user-attachments/assets/4d25e203-0e4f-4b0f-8dc4-e855ce5e6647  

* **Demo đồng bộ & điều khiển:**  
  https://github.com/user-attachments/assets/5223ff30-a859-4433-84c0-bfb3d8a8ed46  

### Chế độ Thu nhỏ (Mini Mode)
Nhấn **`Insert`** để thu nhỏ trình phát thành icon tròn mờ lơ lửng trên màn hình game. Icon sáng viền xanh lá khi nhạc đang phát.

<p align="center">
  <img width="64" height="89" alt="Mini mode icon" src="https://github.com/user-attachments/assets/f0de318f-6a1a-4e92-93c8-ba73b42d4d13" />
</p>

---

## Tính năng nổi bật (v1.2.1)

* **Giao diện Kính mờ Đen tuyền (Obsidian Glass):** Thiết kế tối giản, độ trong suốt tinh tế, sắc nét và hiện đại.
* **Hàng chờ & Phát ngẫu nhiên chuẩn Spotify:**
  * **Hàng chờ ưu tiên (User Queue):** Tách biệt với danh sách đang nghe, phát hết hàng chờ sẽ tự động tiếp tục ngữ cảnh trước đó.
  * **Xáo trộn bài không lặp lại (Fisher-Yates Shuffle):** Tất cả các bài trong danh sách chỉ phát đúng 1 lần trong mỗi chu kỳ.
  * Tự động chọn ngẫu nhiên bài xuất phát khi bấm "Phát ngẫu nhiên" tại Thư viện, Playlist hay Yêu thích.
* **Tự động nhận diện cửa sổ game:** Hỗ trợ Where Winds Meet và Yên Vân Thập Lục Thanh (`yysls.exe`).
* **Chế độ phím linh hoạt:** Hỗ trợ 21 phím tự nhiên hoặc 36 phím bán âm (kèm tổ hợp Shift/Ctrl).
* **Phím tắt toàn cục (Global Hotkeys):** Dừng/Phát (F9), Lùi bài (F10), Chuyển bài (F11), Dừng hẳn (F12) ngay cả khi đang thao tác trong game.
* **Chơi nhóm (Band Mode) & Chia sẻ P2P:** Kết nối nhiều người chơi qua mạng ngang hàng để hòa tấu các bài MIDI nhiều bè.
* **Hỗ trợ đa ngôn ngữ:** Tiếng Việt (mặc định), English, 日本語, 한국어, ไทย, 中文.

---

## Hướng dẫn sử dụng nhanh

### 1. Chuẩn bị file nhạc MIDI
Tạo hoặc mở thư mục `album` nằm cạnh file thực thi và chép các file `.mid` vào:
```text
Chill-Music/
├── chill-music.exe
├── locales/          <- Thư mục chứa các file ngôn ngữ giao diện
├── album/            <- Đặt các bài nhạc .mid tại đây
│   ├── BaiHat1.mid
│   └── BaiHat2.mid
```

### 2. Khởi chạy & Phát nhạc
1. Mở game và vào chế độ nhạc cụ.
2. Nhấp chuột phải vào `chill-music.exe` chọn **Run as administrator** (bắt buộc quyền Admin để giả lập thao tác phím vào cửa sổ game).
3. Chọn bài hát trong Thư viện và bấm **Play**.

---

## Phím tắt mặc định

| Phím | Chức năng |
| :--- | :--- |
| **`F9`** | Phát / Tạm dừng (Play / Pause) |
| **`F10`** | Lùi về bài trước (hoặc tua về 0:00 nếu đã phát >3s) |
| **`F11`** | Chuyển sang bài kế tiếp (Next) |
| **`F12`** | Dừng phát nhạc (Stop) |
| **`Insert`** | Bật / tắt chế độ thu nhỏ (Mini Mode) |
| **`[` / `]`** | Chuyển đổi nhanh chế độ tính nốt |

*(Có thể tùy chỉnh lại phím tắt trong **Settings → Keybindings**).*

---

## Tự biên dịch từ mã nguồn (Build from source)

Dự án sử dụng **Tauri v2 + Rust + Bun + Svelte 5**:

1. **Yêu cầu môi trường:**
   * [Bun](https://bun.sh)
   * [Rust & Cargo](https://rustup.rs) (bản ổn định)
   * C++ Build Tools (Visual Studio 2022 Community hoặc Build Tools)

2. **Chế độ phát triển (Dev Mode):**
   Chạy file **`dev.bat`** (tự động xin quyền Admin, thiết lập môi trường C++ và khởi chạy).

3. **Đóng gói phát hành (Build Release):**
   Chạy file **`build.bat`** hoặc lệnh:
   ```bash
   bun install
   bun run tauri build
   ```
   File thực thi `.exe` phát hành nằm tại:
   `src-tauri/target/release/chill-music.exe`

---

## Đóng góp & Bản quyền

* **Báo lỗi & Đóng góp ý tưởng:** Tạo [Issue](https://github.com/boyherokt/ChillMusic/issues) hoặc gửi Pull Request.
* **Cộng đồng giao lưu:** **[Discord – Vùng Đất Chill](https://discord.com/invite/c9a4paH47J)**.
* **Người duy trì & phát triển hiện tại:** **Hưng (Vùng Đất Chill)**.
* **Tác giả gốc:** **YueLyn (SnowiyQ)**.
