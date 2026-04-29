# FlowTrace

> SaaS platform for IVR call flow documentation, simulation, and audit.

## Phase 1 — Project Foundation + Authentication

### What's Included
- ✅ Next.js 14 (App Router) with TypeScript
- ✅ Tailwind CSS + shadcn/ui components
- ✅ Prisma ORM with PostgreSQL
- ✅ NextAuth.js (Email/Password + Google OAuth)
- ✅ JWT session strategy
- ✅ RBAC roles defined (ADMIN, ARCHITECT, QA, ANALYST, AUDITOR)
- ✅ Protected dashboard shell with sidebar + navbar
- ✅ Responsive design (desktop-first, mobile sidebar)
- ✅ Dark mode default with navy/blue theme

---

## Phase 1 Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database (local, [Supabase](https://supabase.com), or [Railway](https://railway.app))

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL` — Your PostgreSQL connection string
- `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for development
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — (Optional) From [Google Cloud Console](https://console.cloud.google.com)

### 3. Setup Database
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure
```
src/
├── app/
│   ├── api/auth/           → NextAuth + Register API routes
│   ├── auth/               → Login + Register pages
│   ├── dashboard/          → Protected dashboard shell
│   ├── globals.css          → Design system (CSS variables)
│   ├── layout.tsx           → Root layout
│   └── page.tsx             → Landing page
├── components/
│   ├── layout/             → Sidebar, Navbar
│   ├── providers/          → SessionProvider
│   └── ui/                 → shadcn components
├── lib/
│   ├── auth.ts             → NextAuth configuration
│   ├── prisma.ts           → Prisma client singleton
│   └── utils.ts            → Utility functions
├── types/
│   └── next-auth.d.ts      → Type augmentations
└── middleware.ts            → Route protection
```

## RBAC Roles
| Role      | Permissions                      |
|-----------|----------------------------------|
| ADMIN     | Full access                      |
| ARCHITECT | Edit flows                       |
| QA        | Simulate + flag issues           |
| ANALYST   | View + comment + export          |
| AUDITOR   | Read-only + audit trail          |

## Upcoming Phases
- **Phase 2** — Flow import, visual editor, diagramming
- **Phase 3** — Simulation engine, versioning, comments
- **Phase 4** — Billing, team management, export
