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
- 🛡️ **Solo-Member Debt Recalculation Guard**: Proactively protects 1-member groups by disabling the debt recalculation trigger with explicit `(Needs 2+ Members)` indicators until peers join.
- 📱 **Enhanced Registration Flow**: Comprehensive onboarding capturing Full Name, Email, Phone Number, interactive Show/Hide Password visibility, and mandatory Terms & Privacy agreement.
- 🎨 **Apple-Inspired Monochrome Theme**: Sleek pure-black (`#000000`) dark mode with frosted glass blur backdrops, crisp borders (`border-white/10`), high-contrast typography, and Apple system font stacks.
- 🗑️ **Custom Confirmation Modals**: Eliminates intrusive browser `window.confirm` and `window.prompt` dialogs in favor of responsive, keyboard-accessible Apple-style modal dialogs.
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
└── tests/                        # 45 Passing automated Jest test cases
```

---

## 🚀 Step-by-Step Setup Guide (VS Code Terminal)

Follow this step-by-step guide if you are setting up or cloning this project on your work laptop or a fresh machine using **Visual Studio Code**.

---

### 📋 Prerequisites

Ensure the following tools and accounts are ready before starting:

1. **[Visual Studio Code](https://code.visualstudio.com/)** installed.
2. **[Node.js](https://nodejs.org/)** (v18.x or v20.x LTS recommended).
   - Check in terminal:
     ```powershell
     node -v
     npm -v
     ```
3. **[Git](https://git-scm.com/)** installed.
   - Check in terminal:
     ```powershell
     git --version
     ```
4. **Cloud Accounts (Free Tiers)**:
   - **[Supabase](https://supabase.com/)** (Database, Auth, and Storage)
   - **[Google AI Studio](https://aistudio.google.com/)** (Gemini Vision API key)

---

### Step 1: Open VS Code & Open Terminal

1. Launch **Visual Studio Code**.
2. Open your projects folder (e.g. `Documents\Projects` or any folder where you keep code):
   - In VS Code menu: **File** > **Open Folder...**
3. Open the integrated terminal:
   - Press <kbd>Ctrl</kbd> + <kbd>`</kbd> (backtick) or select **Terminal** > **New Terminal** from the top menu.

---

### Step 2: Clone & Open the Project

In the VS Code terminal, run:

```powershell
# 1. Clone the repository
git clone https://github.com/markwlsn/split-and-settle.git

# 2. Navigate into the project folder
cd split-and-settle
```

> [!TIP]
> To open the cloned repository as your active VS Code workspace, click **File** > **Open Folder...** and select the `split-and-settle` folder (or run `code . -r` in the terminal).

---

### Step 3: Cloud & Database Setup (One-Time)

#### A. Supabase Database & Storage Setup
1. Log in to [Supabase](https://supabase.com/) and click **New Project**.
2. Enter a project name (e.g., `split-and-settle`) and set a secure database password.
3. **Run Schema Script**:
   - In the Supabase left sidebar, click **SQL Editor** (`>_` icon).
   - Click **New query**.
   - Copy the entire contents of [`sql/schema.sql`](./sql/schema.sql) and paste it into the query window.
   - Click **Run** (or press <kbd>Ctrl</kbd> + <kbd>Enter</kbd>). You should see `Success. No rows returned`.
4. **Storage Bucket**:
   - In the left sidebar, click **Storage**.
   - Verify that a bucket named `receipts` exists. If not, click **New Bucket**, name it `receipts`, and set it to **Private**.
5. **Retrieve API Keys**:
   - Navigate to **Project Settings** (gear icon) > **API** (or **Data API**).
   - Note down the following 3 values:
     - **Project URL** (e.g. `https://xxxx.supabase.co`)
     - **anon / public key** (starts with `sb_publishable_` or `eyJ...`)
     - **service_role secret key** (starts with `sb_secret_` or `eyJ...`)

#### B. Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **Get API key** → **Create API key**.
4. Copy your generated key (starts with `AIza...` or similar).

---

### Step 4: Configure Environment Variables (`.env`)

In your VS Code terminal (at the project root `split-and-settle`):

1. Create your `.env` file from `.env.example`:
   - **In PowerShell**:
     ```powershell
     Copy-Item .env.example .env
     ```
   - **In Bash / Git Bash**:
     ```bash
     cp .env.example .env
     ```
   - *Or in VS Code File Explorer*: Right-click `.env.example`, select **Copy**, right-click in empty space, select **Paste**, and rename the copied file to `.env`.

2. Open the newly created `.env` file in VS Code and fill in your actual credentials:
   ```ini
   PORT=5000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   GEMINI_API_KEY=your-gemini-api-key
   NODE_ENV=development
   ```

> [!NOTE]
> The frontend is pre-configured to proxy all API requests to `http://localhost:5000` via Vite. You **do not** need to create a separate `.env` file inside the `frontend` folder for local development.

---

### Step 5: Install Dependencies (Backend & Frontend)

Because this is a full-stack project, dependencies must be installed in **both** the root backend directory and the `frontend` directory:

```powershell
# 1. Install Backend Dependencies (from project root)
npm install

# 2. Switch to the frontend directory and install dependencies
cd frontend
npm install

# 3. Return back to project root
cd ..
```

---

### Step 6: Start Backend & Frontend (VS Code Split Terminal)

Run both servers side-by-side using VS Code's **Split Terminal**:

1. Open your VS Code terminal (<kbd>Ctrl</kbd> + <kbd>`</kbd>).
2. Split the terminal pane by clicking the **Split Terminal** icon (the split rectangle `|` in the top right of the terminal window) or by pressing <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>5</kbd>.

#### 💻 Terminal 1 — Backend (Root directory `split-and-settle`)
```powershell
npm run dev
```
> ✅ *Expected output: `Backend server running on port 5000` & `Connected to Supabase`*

#### 💻 Terminal 2 — Frontend (`frontend` directory)
In the second terminal pane:
```powershell
cd frontend
npm run dev
```
> ✅ *Expected output: `VITE v6.x.x ready in ... ms` & `➜ Local: http://localhost:5173/`*

---

### Step 7: Open the App in Your Browser

1. In your web browser, navigate to:
   👉 **[http://localhost:5173](http://localhost:5173)**

2. **Verify the Application**:
   - Click **Create Account** and register with your Name, Email, Phone number, and Password.
   - Click **Create Group** (e.g., *"Dinner & Drinks"*).
   - Test receipt processing by uploading a sample receipt via **Upload Receipt**, or add manual line items via **Manual Expense**.
   - Share the 6-character group invite code with another account or in an incognito window to test real-time splits!

---

### 🛠️ Common Troubleshooting & Tips

#### 1. `'nodemon' is not recognized as an internal or external command`
- **Cause**: Backend dependencies were not installed before running `npm run dev`.
- **Fix**: Run `npm install` in the root `split-and-settle` folder before starting `npm run dev`.

#### 2. `The token '&&' is not a valid statement separator`
- **Cause**: PowerShell 5.1 does not support the bash `&&` chaining syntax.
- **Fix**: Run commands on separate lines or separate them with a semicolon `;` (e.g. `npm install; cd frontend; npm install`).

#### 3. `Port 5000 is already in use (EADDRINUSE)`
- **Cause**: Another process or background instance of Node is holding port 5000.
- **Fix**: 
  - Stop the running process in PowerShell:
    ```powershell
    Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
    ```
  - Or change `PORT=5001` in `.env` and update the port in `frontend/vite.config.js`.

#### 4. Supabase Auth / Connection Errors
- **Cause**: Missing or incorrect keys in `.env`, or the SQL schema was not run.
- **Fix**: Double check your `SUPABASE_URL` and keys in `.env` (ensure no accidental spaces or surrounding quotes), and confirm [`sql/schema.sql`](./sql/schema.sql) was executed in the Supabase SQL editor.

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

The backend includes 45 unit and integration tests verifying settlement algorithms, penny reconciliation, and validation guards:

```bash
npm test
```

---

## 📜 License

MIT License © [Mark Wilson](https://github.com/markwlsn)

