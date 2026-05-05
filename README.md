# 🛡️ Scanmate - AI-Powered Code Security Scanner

Scanmate is a modern, industrial-grade **Static Application Security Testing (SAST)** platform. It combines deep AST-based static analysis with state-of-the-art AI to help developers identify and fix vulnerabilities before they reach production.


## ✨ Core Features

*   **Deep AST Analysis**: Goes beyond regex to understand your code's structure and logic.
*   **AI-Powered Fixes**: Automatically generates secure patches for detected vulnerabilities using Groq & Google Gemini.
*   **Real-time Intelligence**: Live progress updates and instant security scoring.
*   **Modern UX**: A premium "Liquid Glass" dashboard designed for high-performance development teams.

---

## 🔍 How It Works

Scanmate uses a dual-engine approach to ensure maximum security coverage:

1.  **Parsing (AST)**: The backend parses your source code into an **Abstract Syntax Tree (AST)** to track data flow and identify dangerous function calls (e.g., `os.system`, `eval`).
2.  **Semantic Analysis**: Our AI engine analyzes the context of each finding to eliminate false positives and understand complex logic flaws.
3.  **Remediation**: For every confirmed vulnerability, Scanmate provides a detailed explanation, CWE classification, and a ready-to-copy **AI-fixed code snippet**.

---

## 🚀 Quick Setup

### 1. Prerequisites
*   Node.js (v18+)
*   Python (3.10+)
*   Supabase Account

### 2. Backend Configuration
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Update .env with your Supabase & AI credentials
uvicorn app.main:app --reload
```

### 3. Frontend Configuration
```bash
cd app
npm install
npm run dev
```

---

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, Tailwind CSS, GSAP (Animations), Lucide Icons.
*   **Backend**: FastAPI (Python), AST analysis, Regex.
*   **Database**: Supabase (PostgreSQL + Realtime).
*   **AI**: OpenAI GPT-4, Llama 3 (via Groq), Google Gemini.

---

## 🔒 Security First

Scanmate follows a **Zero-Retention Policy**. Your source code is analyzed in volatile sandbox environments and is permanently deleted immediately after the report is generated.

---

Built with ❤️ for a more secure web.
