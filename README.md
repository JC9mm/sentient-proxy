# Sentient Proxy

This project is a frontend interface for interacting with a custom AI backend at `https://search.pdflibrary.tech`.

## 🌐 Live Endpoint
- **Backend API:** `https://search.pdflibrary.tech/generate`

## 🧠 Features
- AI prompt submission with response display
- Logs viewer with filtering
- Recharts visual summary
- Backend status check
- Dark mode toggle (Tailwind CSS)
- Prepared for deployment via cPanel

## 🚀 How to Run

```bash
npm install
npm start
```

## 🛠 Environment

Rename `.env.local.example` to `.env.local` and configure:

```env
VITE_API_BASE=https://search.pdflibrary.tech
```

## 📦 Build for Production

```bash
npm run build
```

Upload `dist/` to your cPanel's `public_html` or desired folder.
