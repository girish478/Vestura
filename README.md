# Vestura VTON

> **Open-source Virtual Clothing Try-On — High-quality clothing try-on engine with pluggable AI & VTON backends.**

**Vestura VTON** is a clean, simple, and high-quality open-source application built specifically for **clothing virtual try-on**.

```text
Upload person photo
        +
Upload clothing photo
        ↓
   AI Try-On
        ↓
Person wearing clothing
```

---

## ⚡ Two Modes & Pluggable Cloud AI System

### 🟢 1. Local / Free Mode (Open-Source GPU Model)

```text
Person + Clothing ──> CatVTON / Local GPU Worker ──> Try-On Result
```

- **No API Key Required.**
- Runs open-source diffusion models (**CatVTON**).
- User provides their own computer / GPU.
- **Hardware Requirement:** NVIDIA GPU with 8GB+ VRAM recommended (CUDA environment).
- Connects to a local worker script ([`scripts/local_vton_server.py`](./scripts/local_vton_server.py)).

---

### ☁️ 2. Cloud Mode (Pluggable VTON APIs & Custom VTON Services)

```text
Person + Clothing + Garment Category ──> Cloud VTON API ──> Try-On Result
```

Configure your preferred cloud AI provider directly in the UI or environment:

| Provider | Type | API Key Required | Description |
|---|---|---|---|
| **Google Gemini** | `[ VTON Native ]` | Yes (`GEMINI_API_KEY`) | Native multimodal image-to-image try-on with identity & garment transfer. |
| **Replicate API** | `[ VTON Native ]` | Yes (`REPLICATE_API_KEY`) | Hosted open-source VTON models (IDM-VTON / CatVTON). |
| **Custom VTON API** | `[ Custom VTON ]` | Optional | Connect any cloud VTON service with API Endpoint, API Key, Model ID, & Garment Category. |

#### Custom VTON API Configuration:
- **API Endpoint:** `https://your-vton-api.com/v1/try-on`
- **API Key:** Automatic authentication (`Bearer` & `x-api-key` headers)
- **Model ID (Optional):** Specify model ID if required by your endpoint
- **Garment Category:** Upper Body, Lower Body, Dresses / Full Body, or Auto-detect

---

## 🎨 Clean & Modern User Experience

- **Focused Interface:** No complex dashboards or extra technical jargon.
- **Simple Uploads:** Drag-and-drop person photo + clothing photo with instant previews.
- **Validation:** Clear validation for JPEG, PNG, WebP up to 10 MB per file.
- **Before/After Comparison:** Toggle side-by-side or single result view.
- **PNG Download:** One-click instant image download.

---

## 🛠️ Quick Start Guide

### 1. Installation

```bash
git clone https://github.com/your-username/vestura-vton.git
cd vestura-vton
npm install
cp .env.example .env
```

### 2. Running in Cloud Mode

1. Choose your provider (e.g. Gemini, Replicate, or Custom VTON API).
2. Set environment variables in `.env` or enter credentials directly in the **Cloud Settings** tab in the UI:
   ```env
   AI_MODE=cloud
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Start the application:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

---

### 3. Running in Local / Free Mode

1. Start the local open-source VTON Python worker:
   ```bash
   python scripts/local_vton_server.py --port 7860
   ```
2. Start the web app:
   ```bash
   npm run dev
   ```
3. Select **Local / Free** in the UI. Vestura VTON will connect to `http://127.0.0.1:7860`.

---

## 🔒 Security & API Key Protection

- **Server-Side Security:** All API keys and endpoints remain strictly server-side.
- Browser requests pass through `/api/try-on` — your API keys are **never** bundled into frontend JavaScript files, localStorage, or committed to GitHub repositories.

---

## 🏗️ Project Architecture

```text
vestura-vton/
├── components/
│   ├── Header.tsx           # Vestura VTON header & mode indicator
│   ├── ModeSelector.tsx     # Local / Free & Custom VTON API settings
│   ├── ImageUploader.tsx    # Drag & drop photo upload
│   └── GeneratedImage.tsx   # Try-on preview & download actions
├── server/
│   ├── index.ts             # Express application server
│   ├── routes/tryOn.ts      # /api/try-on & /api/health endpoints
│   └── ai/
│       ├── provider.ts      # Unified AI factory & health router
│       ├── local/catvton.ts # CatVTON local GPU adapter
│       └── cloud/           # Cloud AI providers (Gemini, Custom VTON, Replicate)
├── scripts/
│   └── local_vton_server.py # Standalone local PyTorch/CatVTON worker
├── shared/
│   └── imageTypes.ts        # Provider metadata & payload interfaces
└── README.md
```

---

## 📋 Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Express + Vite) |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |

---

## 📜 License

[MIT License](./LICENSE)

---

## ⚠️ Disclaimer

Generated try-on results are AI approximations designed to visualize outfit composition and fit. They should not be used as the sole basis for sizing or purchasing decisions.
