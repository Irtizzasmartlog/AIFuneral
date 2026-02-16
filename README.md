# FuneralFlow AI

B2B internal tool for funeral directors (Australia). Automates admin workflow: intake, AI-generated packages and quotes, client email approval, invitations and add-ons, invoice and booking checklist.

**This is NOT a consumer grief chatbot.** It is an internal director-facing tool.

## Tech stack

- Next.js 14 (App Router), TypeScript
- Tailwind CSS, shadcn/ui
- react-hook-form, zod
- TanStack Query, Prisma (SQLite for local dev)
- Resend (or mock email when key missing)
- pdf-lib for quote and invoice PDFs
- next-auth (Credentials) for demo auth

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy the example env and set values as needed:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` – SQLite: `file:./dev.db`
   - `NEXTAUTH_SECRET` – Any long random string (e.g. 32+ chars)
   - `NEXTAUTH_URL` – e.g. `http://localhost:3000`
   - `RESEND_API_KEY` – Optional. If missing, emails are logged to console and stored in `EmailLog` (mock mode).
   - `GEMINI_API_KEY` – Optional. If set, intake chat uses Google Gemini. If missing, uses deterministic mock mode.
   - `GEMINI_MODEL` – Optional. Default `gemini-1.5-flash`.

3. **Database**

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Demo login

- **Email:** `director@elitecare.com.au`
- **Password:** `demo`

## Pages

- `/` – Dashboard (list cases, create new case)
- `/cases/new` – Creates a new case and redirects to intake
- `/cases/[id]/intake` – Step 1: Intake form
- `/cases/[id]/packages` – Step 2: Packages and quote
- `/cases/[id]/email` – Step 3: Email and client approval
- `/cases/[id]/invitations` – Step 4: Invitations (locked unless add-on enabled or client approved)
- `/cases/[id]/invoice` – Step 5: Invoice and booking
- `/settings` – Settings and compliance notice

**Public (no auth):**

- `/public/approve/[token]` – Client selects a package (token in email)
- `/public/request-changes/[token]` – Client submits a change request

## Mock mode

- **Email:** If `RESEND_API_KEY` is not set, emails are not sent; they are logged to the console and stored in `EmailLog` with `provider: "mock"`.
- **Intake chat:** If `GEMINI_API_KEY` is not set, the intake chat uses rule-based mock engine (no LLM calls). The app works fully offline for intake.

## Compliance

This tool does not provide legal advice. All documents and compliance checklists require director review. Disclaimers appear in the app and in generated PDFs where appropriate.

## Scripts

- `npm run dev` – Start dev server
- `npm run build` – Build for production
- `npm run start` – Start production server
- `npm run lint` – Run ESLint
- `npx prisma migrate dev` – Run migrations
- `npx prisma db seed` – Seed demo org, user, and cases
