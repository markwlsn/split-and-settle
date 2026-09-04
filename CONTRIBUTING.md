# Contributing to Split & Settle

Thank you for your interest in contributing to **Split & Settle**! 

## 🛠️ Development Setup

1. **Fork and Clone** the repository:
   ```bash
   git clone https://github.com/markwlsn/split-and-settle.git
   cd split-and-settle
   ```

2. **Backend Setup**:
   ```bash
   npm install
   cp .env.example .env
   # Add your Supabase and Gemini API credentials to .env
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🧪 Testing

Before submitting a PR, ensure all automated tests pass:
```bash
npm test
```

## 📐 Guidelines

- Follow clean commit message conventions (`feat:`, `fix:`, `docs:`, `refactor:`).
- Keep Row Level Security (RLS) policies non-recursive and security-definer protected.
- Ensure all line item calculations maintain exact penny reconciliation ($0.00 remainder).
