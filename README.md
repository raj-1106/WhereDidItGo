# WhereDidItGo 💸

> *"I had money. Then I had a month."*

A brutally honest personal finance tracker that answers the one question you're afraid to ask.

---

## What is this?

WhereDidItGo is a full-stack expense tracker that watches your salary walk in and sprint out — category by category, rupee by rupee. It tracks your monthly spending, visualizes where the damage happened, and uses AI to tell you what you already knew but ignored.

---

## Features

- 📅 **Month-wise tracking** — because denial works best in 30-day cycles
- 💰 **Salary input** — the number that looks big until you start spending
- 🗂️ **11 expense categories** — from *Food & Dining* (necessary) to *Entertainment* (debatable)
- 📊 **Charts that hurt** — pie charts, bar charts, trend lines, all designed to make you feel things
- 🤖 **AI financial advisor** — powered by Groq, pulls no punches, costs less than your last Swiggy order
- 📈 **Insights page** — multi-month trends, savings rate, and the hall of shame (your worst month)
- 🚨 **Overspend warnings** — yes, it will judge you

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + TypeScript + Recharts |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB Atlas |
| AI | Groq API (llama-3.3-70b) |
| Fonts | Syne + DM Mono |
| Theme | Emerald & Gold — because your money deserves to look good leaving |

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Groq API key (free at [console.groq.com](https://console.groq.com))
- A willingness to confront your financial decisions

### 1. Clone & Install

```bash
git clone https://github.com/yourname/whereDidItGo.git
cd whereDidItGo

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install --legacy-peer-deps
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
GROQ_API_KEY=your_groq_api_key
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend  
cd frontend && npm start
```

Open [http://localhost:3000](http://localhost:3000) and begin your journey of self-awareness.

---

## How to Use

1. **Create a month** — enter your salary (the hopeful number)
2. **Add expenses** — every chai, every EMI, every "it was on sale"
3. **Watch the progress bar turn red** — it's not broken, that's just your budget
4. **Go to Insights → Analyze My Spending** — let the AI tell you to stop ordering food at 1am

---

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/months` | All months (the evidence) |
| GET | `/api/months/:year/:month` | One month in detail (the crime scene) |
| POST | `/api/months` | Create/update month salary |
| POST | `/api/months/:year/:month/expenses` | Log an expense (add to the damage) |
| DELETE | `/api/months/:year/:month/expenses/:id` | Delete expense (revisionist history) |
| GET | `/api/insights` | Multi-month analytics (the verdict) |
| POST | `/api/ai-advice` | Get AI recommendations (the intervention) |

---

## Folder Structure
whereDidItGo/
├── backend/
│   ├── src/
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Business logic
│   │   └── index.ts      # Entry point
│   └── .env              # Secrets (don't commit this)
└── frontend/
└── src/
├── pages/        # Dashboard, MonthView, Insights
├── components/   # Shared UI
├── api/          # Backend calls
└── types/        # TypeScript interfaces
---

## The AI Advisor

The Insights page has an **"Analyze My Spending"** button that sends your actual numbers to Groq's Llama 3.3 70B model. It returns:

- An honest summary of your financial health
- 3–5 specific tips per category with estimated monthly savings in ₹
- One priority action for this month

It will not tell you what you want to hear. That's the point.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Backend port (default: 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `GROQ_API_KEY` | Groq API key for AI features |

---

## Contributing

Found a bug? The irony of spending time fixing a spending tracker is not lost on us. PRs welcome.

---

## License

MIT — free to use, free to judge your own finances.

---

*Built with TypeScript, MongoDB, and the quiet shame of checking your bank statement.*