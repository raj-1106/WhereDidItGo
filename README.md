<div align="center">

# 💸 WhereDidItGo

### *"I had money. Then I had a month."*

A brutally honest personal expense tracker that answers the one question you're afraid to ask, and actually remembers whose money it's judging.

<br />

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-1a5c38?style=flat-square)](#)
[![Backend](https://img.shields.io/badge/Backend-Node%20%2B%20MongoDB-1a2e1a?style=flat-square)](#)
[![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20bcrypt-c0392b?style=flat-square)](#)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-4a6a4a?style=flat-square)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-8a9a7a?style=flat-square)](#license)

</div>

<br />

---

## 🕵️ What is this?

WhereDidItGo watches your salary walk in and sprint out, category by category, rupee by rupee. It tracks monthly spending, charts exactly where the damage happened, and uses AI to tell you what you already knew and ignored.

It's also multi-user now, which sounds like a small sentence and was not a small amount of work. Your friend's overspending is not your problem. Your friend's salary is not visible to you. Every query on the backend is scoped to the person asking, not just gated behind a login screen, there's a real difference and it's the difference that matters.

<br />

## 🪧 Features

| | |
|---|---|
| 🔐 **Real auth** | Email + password, bcrypt-hashed, JWT-issued. No shared logins, no "just use my account." |
| 🧾 **Per-user isolation** | Every read and write is scoped by user ID at the database query level. Not "hidden in the UI", actually unreachable. |
| 📅 **Month-wise tracking** | Because denial works best in 30-day cycles, grouped and summed by year so the damage is visible at a glance. |
| 🗂️ **11 expense categories** | From *Food & Dining* (necessary) to *Entertainment* (debatable). |
| 📊 **Charts that hurt** | Pie charts, bar charts, trend lines, all quietly designed to make you feel things. |
| 📦 **Bulk import** | Upload a JSON file of past months. Merges into existing data instead of overwriting it, validates every row, and tells you exactly which ones it skipped and why. |
| 🗑️ **Delete a month** | With a confirmation that states the actual body count, "this deletes 46 expenses", not a generic "are you sure?" nobody reads. |
| 🤖 **AI financial advisor** | Powered by Groq. Pulls no punches. Costs less than your last food delivery order. |
| 📈 **Insights page** | Multi-month trends, savings rate, and the hall of shame (your worst month, ranked). |
| 🚨 **Overspend warnings** | Yes, it will judge you. The progress bar turns red on purpose. |
| 📲 **Installable PWA** | Add to home screen, opens standalone. Precaches the app shell only, deliberately **not** your API responses, so it can't hand your spending history to whoever uses this device next. |

<br />

## 🎨 Design language

Not a themed identity the way a cinema app gets to be, this is a spreadsheet wearing a nice shirt. Warm, paper-toned, unmistakably not a crypto dashboard:

```
bg        #f5f0e8   background — the color of a bank statement you're avoiding
bg-2      #faf7f2   card surfaces
border    #d4c9b5   quiet dividers, nothing glowing
accent    #1a5c38   the green of money, or of hope, before either leaves
danger    #c0392b   overspend warnings, expense delete buttons, honesty
text      #1a2e1a   ink-dark, deliberately unglamorous
```

Display type is `Syne`, geometric and a little self-serious. Numbers run in `DM Mono`, because financial figures deserve to line up in a column, not vibe into alignment.

<br />

## 🧱 Tech stack

```
Frontend    React + TypeScript, Axios, Recharts
Backend     Node.js + Express + TypeScript
Database    MongoDB Atlas (Mongoose)
Auth        JWT (stateless) + bcrypt — no refresh cookie, no third-party
            cookie problem to have in the first place, because there's no
            cookie at all
PWA         Workbox (injectManifest via CRA's built-in detection) —
            app-shell precaching only, no API caching, see: multi-user
AI          Groq (llama-3.1-8b-instant)
Testing     Jest + Supertest + mongodb-memory-server (backend),
            Jest + React Testing Library (frontend)
```

<br />

## 🚀 Getting started

```bash
git clone https://github.com/raj-1106/WhereDidItGo.git
cd WhereDidItGo

cd backend && npm install
cd ../frontend && npm install
```

### Environment variables (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Backend port (default: `5000`) |
| `MONGODB_URI` | MongoDB Atlas connection string. Generate your own, don't reuse one that's ever been committed anywhere. |
| `JWT_SECRET` | Long, random, generated fresh: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `GROQ_API_KEY` | Free at [console.groq.com](https://console.groq.com) |

### Environment variables (`frontend`, production only)

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Full backend URL (e.g. `https://your-api.onrender.com/api`). Frontend and backend are genuinely cross-origin here, no proxy rewrite hiding it, which is fine, because auth is a Bearer token, not a cookie. Nothing to leak across origins that isn't already sent on purpose. |

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

Open [http://localhost:3000](http://localhost:3000) and begin your journey of self-awareness.

<br />

## 🧪 Testing

```bash
cd backend && npm test    # Jest + Supertest, real Mongoose behavior via
                           # an in-memory DB, not mocked away
cd frontend && npm test   # AuthContext, import-file parsing, year-grouping
                           # math — the logic worth asserting on, not
                           # every JSX render
```

<br />

## 📂 Project structure

```
WhereDidItGo/
├── backend/
│   ├── src/
│   │   ├── models/         # User, Month
│   │   ├── routes/         # auth, months
│   │   ├── controllers/    # business logic, incl. bulk import validation
│   │   ├── middleware/     # authMiddleware
│   │   ├── __tests__/      # Jest + Supertest
│   │   ├── app.ts          # Express app, importable without a live DB
│   │   └── index.ts        # entry point: connects DB, then listens
│   └── scripts/            # one-off migrations (e.g. backfilling userId)
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # Dashboard, MonthView, Insights, Login, Register
│   │   ├── context/        # AuthContext
│   │   ├── api/            # backend calls, axios interceptors
│   │   ├── utils/          # pure helpers (import parsing, year grouping)
│   │   └── types/
│   └── public/              # manifest.json, service worker output
```

<br />

## 🗺️ Roadmap

- [x] Multi-user auth & per-query data isolation
- [x] Bulk import with merge semantics and per-row validation
- [x] Installable PWA, app-shell only, no cross-user cache leakage
- [x] Delete month, with an honest confirmation dialog
- [x] Real test suites, not vibes
- [ ] Server-side session revocation (logout that actually invalidates the token, not just clears local storage)
- [ ] Soft-delete / undo window, so "Delete Permanently" isn't the only option
- [ ] Rate limiting on write endpoints
- [ ] A UI refresh that isn't secretly a crypto trading dashboard in disguise

<br />

## 🤝 Contributing

Found a bug? The irony of spending time fixing a spending tracker is not lost on anyone. PRs welcome, if it touches `monthController.ts`, prove the query is still scoped to the authenticated user, not just that it compiles.

<br />

## 📄 License

MIT — free to use, free to judge your own finances.

<br />

<div align="center">

*Built with TypeScript, MongoDB, and the quiet discipline of actually rotating a secret after leaking one.*

</div>
