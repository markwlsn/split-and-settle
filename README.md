# 🧾 Split & Settle

> **Intelligent Receipt Splitting & Debt Optimization Powered by Google Gemini Vision & Supabase**

[![React](https://img.shields.io/badge/React-18-blue.svg?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg?logo=node.js)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%7C%20RLS-3ECF8E.svg?logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Vision%20AI-4285F4.svg?logo=google)](https://deepmind.google/technologies/gemini/)

---

## 🌟 Overview

**Split & Settle** eliminates the friction of splitting shared expenses. Simply take a photo of any receipt — whether in English, Japanese, Tagalog, Spanish, French, or German — and **Google Gemini Vision** automatically extracts itemized lines, prices, taxes, and detects the currency. 

Our algorithmic settlement engine then reduces circular group debts to the **absolute minimum number of transactions** using a pure **Greedy Minimum Cash Flow algorithm**.

---

## ✨ Key Features

- 📸 **Universal Multilingual AI Receipt OCR**: Powered by Google Gemini Vision. Seamlessly parses itemized receipts in English, Japanese (Kanji/Kana), Korean, Tagalog, Spanish, French, German, Italian, etc., with automatic English translations and PII privacy redaction.
- 🌍 **Universal Multi-Currency Detection**: Auto-detects currencies from receipt symbols (`$`, `₱`, `¥`, `€`, `£`, `₩`, `₹`, `฿`, `₫`, `R$`, etc.) or permits 1-click manual switching with zero-decimal currency support (JPY, KRW, VND, IDR).
- ⚡ **Direct Receipt Onboarding**: Attach a receipt directly while creating a group — Gemini automatically scans the receipt, sets the currency, and takes you straight into the itemized split screen.
- 🧮 **Greedy Settlement Optimization**: Minimizes peer-to-peer payments so groups never have to execute circular transfers.
- 🔒 **Enterprise Row-Level Security (RLS)**: Enforces multi-tenant data privacy and group isolation directly at the database level using PostgreSQL security definer policies.
- 🎟️ **6-Character Invite Codes**: Join groups instantly with human-readable invite codes (e.g. `TRIP26`) without sharing UUIDs.
- 📊 **Spending Analytics & Activity Feed**: Category distribution charts, top merchants, per-member consumption metrics, and a chronological audit log.
- 📤 **Export & Share**: 1-click CSV expense ledger download and instant formatted settlement summaries for WhatsApp, Telegram, or Discord.

---

## 🏗️ Architecture

```
split-and-settle/
├── frontend/                     # React 18 + Vite + Tailwind CSS Client
│   ├── src/
│   │   ├── components/           # Modals, Navbar, Activity Feed, Toast System
│   │   ├── views/                # Auth, Dashboard, Group Hub, Receipt Splitter
│   │   ├── context/              # AuthContext & ToastContext
│   │   ├── services/             # API client with JWT bearer authentication
│   │   └── utils/                # Currency formatters & math utilities
│   └── vite.config.js
│
├── sql/                          # Supabase PostgreSQL Schemas & RLS Fixes
│   └── schema.sql                # Complete master database schema
│
├── src/                          # Express REST API Backend
│   ├── controllers/              # Auth, Group, Receipt, Settlement controllers
│   ├── lib/                      # Supabase & Gemini AI client factories
│   ├── routes/                   # Validated REST API endpoints
│   ├── utils/                    # Settlement algorithms & split calculators
│   └── server.js                 # HTTP Server entry point
│
└── tests/                        # 42 Passing automated Jest test suites
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ or v20+
- **Supabase Account**: [supabase.com](https://supabase.com)
- **Google Gemini API Key**: [aistudio.google.com](https://aistudio.google.com/)

---

### 1. Database Setup (Supabase)
1. Open your **Supabase Dashboard** → **SQL Editor** → **New Query**.
2. Copy and run the entire contents of [`sql/schema.sql`](./sql/schema.sql).
3. Ensure a storage bucket named `receipts` exists (set to Private).

---

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/markwlsn/split-and-settle.git
cd split-and-settle

# Install backend dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `.env` with your credentials:
```ini
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev
```
*Backend runs on `http://localhost:5000`*

---

### 3. Frontend Setup
```bash
# In a new terminal window:
cd split-and-settle/frontend

# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 📡 API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/health` | Service health status & uptime | No |
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Sign in user & receive JWT | No |
| `POST` | `/groups` | Create a new group | Yes |
| `GET` | `/groups` | List user's groups | Yes |
| `GET` | `/groups/:id` | Get group details & receipt ledger | Yes |
| `POST` | `/groups/join` | Join group via 6-char invite code | Yes |
| `POST` | `/groups/:id/receipts` | Upload receipt photo for scanning | Yes |
| `POST` | `/groups/:id/expenses` | Create manual non-photo expense | Yes |
| `POST` | `/receipts/:id/parse` | Trigger Gemini AI receipt parsing | Yes |
| `POST` | `/receipts/:id/auto-split` | Auto-split receipt items across members | Yes |
| `POST` | `/receipts/:id/confirm` | Confirm receipt & recompute debts | Yes |
| `GET` | `/groups/:id/settlements` | Get minimum-transaction settlements | Yes |
| `POST` | `/groups/:id/settlements/payments` | Record peer payment & clear balance | Yes |
| `GET` | `/groups/:id/analytics` | Spending breakdown & member metrics | Yes |

---

## 🧪 Running Tests

The backend includes 44 unit and integration tests verifying settlement algorithms, penny reconciliation, and validation guards:

```bash
npm test
```

---

## 📜 License

MIT License © [Mark Wilson](https://github.com/markwlsn)

