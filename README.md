# Claude 3 AI Chat

Antarmuka AI Chat modern dan minimalis yang didukung oleh Claude 3, dibangun dengan React, Vite, Tailwind CSS, dan Framer Motion.

![Preview](https://img.shields.io/badge/Claude_3-Haiku-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)

## Fitur

- 🎨 **UI Minimalis** - Desain bersih ala iOS
- 💬 **Streaming Cepat** - Animasi teks yang halus
- 🤖 **Claude 3 Haiku** - Didukung AI dari Anthropic
- 📱 **Responsif Mobile** - Berfungsi di semua perangkat
- 🌙 **Mode Gelap/Terang** - Tema otomatis
- 💾 **Sesi Tersimpan** - Riwayat chat disimpan di IndexedDB
- 📊 **Grafik** - Chart Bar, Line, Pie, Donut
- 📝 **Markdown** - Syntax highlighting untuk kode
- 🗂️ **Multi Sesi** - Kelola banyak percakapan
- ✏️ **Edit Pesan** - Edit pesan kapan saja
- 🔄 **Regenerasi** - Regenerasi jawaban AI
- ⏹️ **Stop Generasi** - Batalkan respons AI
- 🔗 **Bagikan Chat** - Buat link untuk berbagi
- 🔁 **Retry Error** - Coba ulang saat gagal

## Tech Stack

| Kategori | Teknologi |
| -------- | --------- |
| Framework | React 18 + Vite |
| Bahasa | TypeScript |
| Styling | Tailwind CSS |
| Animasi | Framer Motion |
| Icons | Iconsax React, Lucide |
| AI Backend | Claude 3 Haiku |
| Charts | Chart.js |
| Markdown | react-markdown |
| Code Highlight | react-syntax-highlighter |
| Diagram | Mermaid |
| Storage | IndexedDB |

## Instalasi

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Build untuk production
npm run build
```

## Struktur Proyek

```text
src/
├── App.tsx              # Aplikasi utama
├── components/
│   ├── ChatInput.tsx    # Input pesan
│   ├── ChatMessage.tsx  # Tampilan pesan
│   ├── Header.tsx       # Navigasi atas
│   ├── Sidebar.tsx      # Daftar sesi
│   ├── SettingsDialog.tsx
│   ├── ShareDialog.tsx  # Modal bagikan
│   ├── SharedChatView.tsx
│   ├── WelcomeScreen.tsx
│   └── ui/              # Komponen UI
├── lib/
│   ├── claude.ts        # API client
│   ├── db.ts            # Penyimpanan IndexedDB
│   └── share.ts         # Utilitas share
└── hooks/
```

## Deployment

Proyek ini dikonfigurasi untuk deployment Vercel dengan Edge Runtime API.

```bash
# Deploy ke Vercel
vercel deploy
```

## Lisensi

MIT
