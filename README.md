# Scanmate AI Code Scanner

## Industrial-Grade SAST (Static Application Security Testing) Platform

Scanmate is an AI-powered code security scanner designed for modern development teams. Built with a "Liquid Glass" aesthetic, it combines deep AST-based static analysis with AI-powered fix generation to help developers ship secure code faster.

---

## System Architecture

```
Scanmate/
├── frontend/                    # Next.js 14+ Frontend (React + Vite)
│   ├── src/
│   │   ├── sections/            # Page sections (LandingPage, ScannerDashboard)
│   │   ├── components/          # Reusable components (RollingCubeGallery, Starfield, FlipCard, Navigation)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript type definitions
│   │   ├── App.tsx              # Root component with view routing
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Global styles with Liquid Glass system
│   ├── public/                  # Static assets (images, fonts)
│   ├── tailwind.config.js       # Tailwind with custom Liquid Glass theme
│   ├── vite.config.ts           # Vite build configuration
│   └── package.json
│
├── backend/                     # Python FastAPI Backend
│   ├── app/
│   │   ├── core/                # Core configuration & database
│   │   │   ├── config.py        # Pydantic settings management
│   │   │   └── database.py      # Supabase PostgreSQL client
│   │   ├── models/              # Pydantic schemas
│   │   │   └── schemas.py       # Request/response models
│   │   ├── routers/             # API route handlers
│   │   │   └── scan.py          # Scan endpoints (POST /api/v1/scan)
│   │   ├── services/            # Business logic
│   │   │   └── ast_analyzer.py  # AST-based SAST engine
│   │   ├── ai/                  # AI integration layer
│   │   │   └── ai_service.py    # OpenAI/Llama-3 fix generation
│   │   └── main.py              # FastAPI application factory
│   ├── supabase/
│   │   └── schema.sql           # Complete PostgreSQL schema
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Environment variables template
│
└── README.md                    # This file
```

---

## Technology Stack

### Frontend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 + Vite | UI rendering and build tooling |
| Language | TypeScript | Type-safe development |
| Styling | Tailwind CSS 3.4 | Utility-first CSS with custom Liquid Glass theme |
| Components | shadcn/ui | Pre-built accessible UI primitives |
| 3D Graphics | Three.js + @react-three/fiber | Interactive starfield footer |
| Animation | GSAP | Flip card animations and transitions |
| Icons | Lucide React | Consistent icon system |

### Backend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | FastAPI | High-performance async API |
| Analysis | Python `ast` module | Abstract Syntax Tree parsing |
| AI | OpenAI GPT-4 / Llama-3 | Secure code fix generation |
| Database | Supabase PostgreSQL | User data, scans, vulnerabilities |
| Auth | Supabase Auth | JWT-based authentication |
| Real-time | Supabase Realtime | Live scan progress updates |
| Storage | Supabase Storage | Report file storage |

---

## Core Features

### 1. AST-Based Static Analysis
- Deep code parsing using Python's `ast` module
- Detects 10+ vulnerability categories:
  - SQL Injection (CWE-89)
  - Hardcoded Secrets (CWE-798)
  - Insecure Deserialization (CWE-502)
  - Command Injection (CWE-78)
  - Path Traversal (CWE-22)
  - Weak Cryptography (CWE-327)
  - Cross-Site Scripting (CWE-79)
  - Server-Side Request Forgery (CWE-918)
  - Debug Mode Exposure (CWE-489)
  - Insecure Headers

### 2. AI-Powered Fix Generation
- Integration with OpenAI GPT-4 and Llama-3
- Generates production-ready secure code replacements
- Context-aware explanations and recommendations
- One-click copy of AI fixes

### 3. Real-time Dashboard
- Security score (0-100) per scan
- Severity breakdown (Critical/High/Medium/Low)
- Vulnerability details with CWE references
- Scan history and trend analysis

### 4. Liquid Glass Design System
- Frosted glass panels with `backdrop-blur-xl`
- 1px glass borders with subtle transparency
- Obsidian (#09090b) and pure white backgrounds
- Emerald (#10b981) for secure elements
- Ruby (#e11d48) for vulnerabilities

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Supabase account (free tier works)
- OpenAI API key (optional, for AI fixes)

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Open the SQL Editor in your Supabase dashboard
3. Run the complete schema from `backend/supabase/schema.sql`
4. Enable Row Level Security (RLS) policies
5. Set up authentication providers (Email, GitHub)

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Application
DEBUG=true
SECRET_KEY=your-super-secret-key-change-in-production

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Providers (optional)
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4-turbo-preview

LLAMA_API_ENDPOINT=https://your-llama-endpoint.com
LLAMA_API_KEY=your-llama-key
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/scan` | Analyze source code for vulnerabilities |
| `POST` | `/api/v1/scan/file` | Upload and scan a file |
| `GET` | `/api/v1/scan/{id}/progress` | Get real-time scan progress |
| `GET` | `/api/v1/health` | Health check endpoint |
| `GET` | `/api/v1/vulnerabilities/rules` | List detection rules |

### Example: Scan Code

```bash
curl -X POST http://localhost:8000/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import os; query = f\"SELECT * FROM users WHERE id = '\''{user_id}'\''\",
    "language": "python",
    "filename": "app.py",
    "use_ai": true,
    "ai_model": "gpt-4"
  }'
```

### Example Response

```json
{
  "id": "scan-a1b2c3d4e5f6",
  "timestamp": "2025-04-30T12:00:00Z",
  "filename": "app.py",
  "language": "python",
  "total_lines": 3,
  "scan_duration_ms": 1850,
  "security_score": 25,
  "vulnerabilities": [
    {
      "id": "vuln-1",
      "title": "SQL Injection via String Concatenation",
      "severity": "critical",
      "vulnerability_type": "sql_injection",
      "line": 2,
      "column": 8,
      "description": "User-supplied input is directly concatenated into a SQL query...",
      "cwe_id": "CWE-89",
      "cwe_name": "SQL Injection",
      "recommendation": "Use parameterized queries...",
      "fixed_code": "query = \"SELECT * FROM users WHERE id = ?\"\ncursor.execute(query, (user_id,))",
      "confidence_score": 0.95
    }
  ],
  "status": "completed"
}
```

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `users` | Extended user profiles linked to Supabase Auth |
| `scans` | Scan records with metadata and security scores |
| `vulnerabilities` | Individual vulnerability findings |
| `audit_logs` | Comprehensive audit trail for compliance |
| `reports` | Generated report files (PDF, JSON, SARIF) |

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Admins can access all data for management
- Audit logs are immutable for compliance

### Realtime

Supabase Realtime broadcasts scan progress updates:
- `queued` → `parsing` → `analyzing` → `ai_processing` → `completed`
- Frontend subscribes to `scan_progress:{scan_id}` channel

---

## Frontend Pages

### Landing Page (`/`)
- **Hero**: 3D Rolling Code Cube Gallery with parallax mouse tracking
- **Editor Showcase**: Split-pane code editor with AI analysis demo
- **Use Case Gallery**: 6 interactive flip cards for vulnerability types
- **Stats Section**: Key metrics display
- **CTA Section**: Account creation prompt
- **Footer**: Interactive WebGL starfield with drag/zoom

### Scanner Dashboard (`/scanner`)
- **Sidebar**: Navigation with icons (Dashboard, Scanner, Reports, History, Settings)
- **Code Editor**: Monaco-style editor with line numbers and syntax highlighting
- **Analysis Panel**: Real-time vulnerability feed with severity badges
- **Dashboard Tab**: Security scores, project lists, scan history table
- **Settings Tab**: Scan configuration, AI model selection, notifications

---

## Security Considerations

### Input Validation
- Maximum file size: 5MB
- Maximum code length: 500,000 characters
- SQL injection protection in all database queries
- File type validation for uploads

### Authentication
- JWT-based authentication via Supabase Auth
- Row Level Security (RLS) on all database tables
- Token expiration: 30 minutes

### AI Safety
- AI-generated fixes are marked with confidence scores
- Fallback to rule-based analysis when AI is unavailable
- No code is executed during analysis (purely static)

---

## Deployment

### Frontend (Vercel/Netlify)
1. Connect your Git repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables if needed

### Backend (Render/Railway/Fly.io)
1. Connect your Git repository
2. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add all environment variables from `.env`

### Database (Supabase)
1. Create project at supabase.com
2. Run schema.sql in SQL Editor
3. Configure authentication providers
4. Connect frontend and backend to Supabase project

---

## License

Proprietary - Scanmate

For support, contact support@scanmate.ai or open an issue in the repository.
