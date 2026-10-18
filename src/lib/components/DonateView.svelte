<script>
  import Icon from "@iconify/svelte";
  import { invoke } from "../tauri/core-proxy.js";
  import qrDefault from "../../../src-tauri/icons/qr.jpg";
  import qrKofi from "../../../src-tauri/icons/qrcodekofi.png";
  import { fly, fade } from "svelte/transition";
  let qrDataUrl = qrDefault; // QR cố định, không thay đổi
</script>

<div class="h-full flex flex-col p-6 space-y-6">
  <!-- Header Section -->
  <div class="space-y-2">
    <div class="flex items-center gap-3">
      <div
        class="w-12 h-12 rounded-2xl bg-[#1db954]/10 flex items-center justify-center text-[#1db954]"
      >
        <Icon icon="mdi:hand-heart" class="w-7 h-7" />
      </div>
      <div>
        <h2 class="text-3xl font-black tracking-tight text-white">
          Ủng hộ dự án
        </h2>
        <p class="text-white/50 text-sm italic">
          Cảm ơn bạn đã tiếp thêm động lực cho Vùng Đất Chill
        </p>
      </div>
    </div>
  </div>

  <div class="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar space-y-8">
    <!-- Donation Methods Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Local QR Card -->
      <div
        class="relative group rounded-3xl bg-gradient-to-br from-[#1db954]/20 to-[#1db954]/5 border border-[#1db954]/20 p-6 space-y-4 hover:border-[#1db954]/40 transition-all shadow-xl shadow-[#1db954]/5"
        in:fly={{ y: 20, duration: 400, delay: 100 }}
      >
        <div class="flex items-center justify-between">
          <div
            class="p-3 rounded-2xl bg-[#1db954] text-white shadow-lg shadow-[#1db954]/20"
          >
            <Icon icon="mdi:qrcode-scan" class="w-6 h-6" />
          </div>
          <span
            class="px-3 py-1 rounded-full bg-[#1db954]/20 text-[#1db954] text-[10px] font-bold uppercase tracking-wider"
            >Phổ biến nhất</span
          >
        </div>
        <div>
          <h3 class="text-xl font-bold text-white">Ngân hàng / MoMo</h3>
          <p class="text-sm text-white/60">
            Hỗ trợ VietQR, Napas 24/7 và ví điện tử
          </p>
        </div>

        <!-- QR Display -->
        <div
          class="bg-black/40 rounded-2xl p-4 flex items-center justify-center border border-white/5 relative overflow-hidden group/qr"
        >
          <img
            src={qrDataUrl}
            alt="QR Code"
            class="max-h-64 w-auto rounded-xl shadow-2xl transition-transform duration-500 group-hover/qr:scale-105"
          />
          <div
            class="absolute inset-0 bg-black/60 opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
          >
            <p class="text-white font-bold text-sm">Quét để ủng hộ</p>
          </div>
        </div>

        <div class="space-y-2">
          <div
            class="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5 group/text"
          >
            <div>
              <p class="text-[10px] text-white/40 uppercase font-bold">
                Nội dung chuyển khoản
              </p>
              <p class="text-sm font-mono font-bold text-[#1db954]">
                UNG HO VDC
              </p>
            </div>
            <button
              class="p-2 rounded-lg bg-white/5 hover:bg-[#1db954]/20 text-white/40 hover:text-[#1db954] transition-all"
              onclick={() => navigator.clipboard.writeText("UNG HO VDC")}
            >
              <Icon icon="mdi:content-copy" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Global Support Card (Ko-fi) -->
      <div
        class="flex flex-col rounded-3xl bg-gradient-to-br from-[#29abe0]/20 to-[#29abe0]/5 border border-[#29abe0]/20 p-6 space-y-6 hover:border-[#29abe0]/40 transition-all shadow-xl shadow-[#29abe0]/5"
        in:fly={{ y: 20, duration: 400, delay: 200 }}
      >
        <div class="flex items-center justify-between">
          <div
            class="p-3 rounded-2xl bg-[#29abe0] text-white shadow-lg shadow-[#29abe0]/20"
          >
            <Icon icon="simple-icons:kofi" class="w-6 h-6" />
          </div>
          <span
            class="px-3 py-1 rounded-full bg-[#29abe0]/20 text-[#29abe0] text-[10px] font-bold uppercase tracking-wider"
            >Payments</span
          >
        </div>

        <div class="flex-1 space-y-4">
          <div>
            <h3 class="text-xl font-bold text-white">Ko-fi / PayPal</h3>
            <p class="text-sm text-white/60">
              Hỗ trợ qua PayPal/Visa dành cho các bạn ở nước ngoài
            </p>
          </div>

          <!-- Ko-fi QR Display -->
          <div
            class="bg-black/40 rounded-2xl p-4 flex items-center justify-center border border-white/5 relative overflow-hidden group/qr"
          >
            <img
              src={qrKofi}
              alt="Ko-fi QR"
              class="max-h-64 w-auto rounded-xl shadow-2xl transition-transform duration-500 group-hover/qr:scale-105"
            />
            <div
              class="absolute inset-0 bg-[#29abe0]/10 opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
            >
              <p class="text-white font-bold text-sm">Quét để mở Ko-fi</p>
            </div>
          </div>

          <button
            onclick={() =>
              invoke("open_url", { url: "https://ko-fi.com/huwngnef" })}
            class="w-full py-4 rounded-2xl bg-[#29abe0] hover:bg-[#2291be] text-white font-bold text-center transition-all shadow-lg shadow-[#29abe0]/20 flex items-center justify-center gap-2 group relative overflow-hidden"
          >
            <div
              class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            ></div>
            <span>Buy me a Coffee</span>
            <Icon
              icon="mdi:coffee"
              class="w-5 h-5 group-hover:animate-bounce"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Heartfelt Message -->
    <div
      class="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4"
      in:fade={{ delay: 500 }}
    >
      <div class="flex items-center gap-2 text-[#1db954]">
        <Icon icon="mdi:message-heart" class="w-5 h-5" />
        <h3 class="font-bold">Gửi đến bạn,</h3>
      </div>
      <p class="text-sm text-white/70 leading-relaxed">
        Bất kể số tiền lớn hay nhỏ, sự ủng hộ của bạn chính là minh chứng cho sự
        tin tưởng đối với dự án. Mọi khoản đóng góp sẽ được dành trọn vẹn để <strong
          class="text-white">duy trì và cập nhật app thường xuyên</strong
        > cũng như cải thiện và nâng cấp chất lượng ứng dụng ngày một tốt hơn.
      </p>
      <div class="flex flex-wrap gap-4 pt-2">
        <div class="flex items-center gap-2 text-xs text-white/40">
          <Icon icon="mdi:check-circle" class="w-4 h-4 text-[#1db954]" />
          <span>Cập nhật tính năng miễn phí</span>
        </div>
        <div class="flex items-center gap-2 text-xs text-white/40">
          <Icon icon="mdi:check-circle" class="w-4 h-4 text-[#1db954]" />
          <span>Duy trì cộng đồng MIDI</span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
